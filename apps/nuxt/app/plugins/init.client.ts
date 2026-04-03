//@ts-ignore
import VueVirtualScroller from 'vue-virtual-scroller'
import { ENV } from '@typewords/core/config/env.ts'

export default defineNuxtPlugin(async nuxtApp => {
  if (
    !location.href.includes('192.168') &&
    !location.href.includes('172.16') &&
    !location.href.includes('10.0')
  ) {
    //51.la
    ;(function () {
      window.LA = window.LA || {
        ids: [{ id: '3OH8ITYRgwzo58L2', ck: '3OH8ITYRgwzo58L2' }],
        id: '3OH8ITYRgwzo58L2',
        ck: '3OH8ITYRgwzo58L2',
        hashMode: true,
      }
      const script = document.createElement('script')
      script.src = ENV.RESOURCE_URL + `/libs/51.js`
      document.head.appendChild(script)
    })()

    // baidu
    var _hmt = _hmt || []
    ;(function () {
      var hm = document.createElement('script')
      hm.src = 'https://hm.baidu.com/hm.js?3dae52fcd5375a19905462e4ad3eb54e'
      document.head.appendChild(hm)
    })()

    // umami
    ;(function () {
      var umami2 = document.createElement('script')
      umami2.src = ENV.RESOURCE_URL + 'libs/s.js'
      umami2.setAttribute('data-website-id', '160308c9-7900-4b1d-a0b1-c3b25a9530f6')
      document.head.appendChild(umami2)
    })()

    // umami-saas
    // ;(function () {
    //   var umami2 = document.createElement('script')
    //   // umami2.src = ENV.RESOURCE_URL + 'libs/my-um.js'
    //   // umami2.setAttribute('data-website-id', '03102800-e8e8-40a2-addf-9999d5e5c525')
    //   umami2.src = 'https://stat.typewords.cc/script.js'
    //   umami2.setAttribute('data-website-id', 'e725f66a-1f63-4c53-a96b-ba073edecac8')
    //   document.head.appendChild(umami2)
    // })()
  }

  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/service-worker.js')
        .then(registration => {
          console.log('ServiceWorker registration successful with scope: ', registration.scope)
        })
        .catch(error => {
          console.log('ServiceWorker registration failed: ', error)
        })
    })
  }

  console.json = function (v: any, space = 0) {
    const json = JSON.stringify(
      v,
      (key, value) => {
        if (Array.isArray(value) && key !== 'nameList') {
          return `__ARRAY__${JSON.stringify(value)}`
        }
        return value
      },
      space
    )
      .replace(/"__ARRAY__(\[.*?\])"/g, (_, arr) => arr)
      // 专门处理 nameList，将其压缩成一行
      .replace(/"nameList": \[\s*([^\]]+)\s*\]/g, (match, content) => {
        // 移除数组内部的换行和多余空格，但保留字符串间的空格
        const compressed = content.replace(/\s*\n\s*/g, ' ').trim()
        return `"nameList": [${compressed}]`
      })

    console.log(json)
    return json
  }
  console.parse = function (v: any) {
    console.log(JSON.parse(v))
  }

  nuxtApp.vueApp.use(VueVirtualScroller)
})
