import { APP_VERSION, AppEnv, DictId, LOCAL_FILE_KEY } from '../config/env.ts'
import { _dateFormat, debounce, shakeCommonDict } from '../utils'
import { get, set } from 'idb-keyval'
import { syncSetting } from '../apis'
import { useBaseStore } from '../stores/base.ts'
import { useRuntimeStore } from '../stores/runtime.ts'
import { useSettingStore } from '../stores/setting.ts'
import { useUserStore } from '../stores/user.ts'
import { CompareResult } from '../types'
import { Supabase } from '../utils/supabase.ts'
import { ensureHashGuardBeforeInit, useDataSyncPersistence } from './useDataSyncPersistence'
import dayjs from 'dayjs'

let unsub = null
let unsub2 = null

export function useInit() {
  const store = useBaseStore()
  const settingStore = useSettingStore()
  const runtimeStore = useRuntimeStore()
  const userStore = useUserStore()
  const dataSync = useDataSyncPersistence()
  let isInitializing = true // 标记是否正在初始化

  const onvisibilitychange = async () => {
    //如果标签页失活了就不保存数据了
    if (document.hidden) {
      isInitializing = true
    } else {
      //当激活时，要先获取数据，以保证本地是最新的，以免本地老数据上传到后端覆盖新数据
      isInitializing = true
      await dataSync.pullRemoteIfNewer(['setting', 'dict'])
      store.load = true
      settingStore.load = true
      isInitializing = false
    }
  }

  onUnmounted(() => {
    document.removeEventListener('visibilitychange', onvisibilitychange)
  })

  //init 有可能重复执行，因为从老网站导了数据之后需要 init
  async function init() {
    let lastAudioFileIdList = []

    document.removeEventListener('visibilitychange', onvisibilitychange)
    document.addEventListener('visibilitychange', onvisibilitychange)

    unsub?.()
    //用 $subscribe 替代 watch
    unsub = store.$subscribe(
      debounce(async (mutation, n) => {
        // 如果正在初始化，不保存数据，避免覆盖
        if (isInitializing || runtimeStore.globalLoading) return
        console.log('store.$subscribe', mutation, n)
        let data = shakeCommonDict(n)

        //筛选自定义和收藏
        let bookList = data.article.bookList.filter(v => v.custom || [DictId.articleCollect].includes(v.id))
        let audioFileIdList = []
        bookList.forEach(v => {
          //筛选 audioFileId 字体有值的
          v.articles
            .filter(s => !s.audioSrc && s.audioFileId)
            .forEach(a => {
              //所有 id 存起来，下次直接判断字符串是否相等，因为这个watch会频繁调用
              audioFileIdList.push(a.audioFileId)
            })
        })
        if (audioFileIdList.toString() !== lastAudioFileIdList.toString()) {
          let result = []
          //删除未使用到的文件
          get(LOCAL_FILE_KEY).then((fileList: Array<{ id: string; file: Blob }>) => {
            const files = fileList ?? []
            audioFileIdList.forEach(a => {
              let item = files.find(b => b.id === a)
              item && result.push(item)
            })
            set(LOCAL_FILE_KEY, result)
            lastAudioFileIdList = [...audioFileIdList]
          })
        }

        if (audioFileIdList.length === 0) {
          isInitializing = true
          const compareResult = await dataSync.saveLocalAndSync('dict', data, { pullWhenRemoteNewer: false })
          if (compareResult === CompareResult.RemoteNewer) {
            await dataSync.pullRemoteIfNewer(['setting', 'dict'])
          }
          isInitializing = false
        } else {
          if (Supabase.check()) {
            Supabase.setStatus('error', '检测到自定义文章里面有自定义音频，无法使用同步功能')
          }
        }
      }, 1000)
    )

    unsub2?.()
    unsub2 = settingStore.$subscribe(
      debounce(async (mutation, data) => {
        if (isInitializing || runtimeStore.globalLoading) return
        // console.log('settingStore.$subscribe', mutation, state, isInitializing)

        isInitializing = true
        const compareResult = await dataSync.saveLocalAndSync('setting', data, { pullWhenRemoteNewer: false })
        if (compareResult === CompareResult.RemoteNewer) {
          await dataSync.pullRemoteIfNewer(['setting', 'dict'])
        }
        isInitializing = false
        if (AppEnv.CAN_REQUEST) {
          syncSetting(null, settingStore.$state)
        }
      }, 1000)
    )

    console.time('init')
    await ensureHashGuardBeforeInit()
    await userStore.init()
    await store.init()
    await settingStore.init()
    await dataSync.pullRemoteIfNewer(['setting', 'dict'])
    console.timeEnd('init')
    store.load = true
    isInitializing = false // 初始化完成，允许保存数据

    runtimeStore.isNew = APP_VERSION.version > Number(settingStore.webAppVersion)
    runtimeStore.isError = Supabase.getStatus().status === 'error'
    window.umami?.track('host', { host: window.location.host })
  }

  return init
}
