<script setup lang="ts">
import { Slider, Switch } from '@typewords/base'
import SettingItem from './SettingItem.vue'
import { useSettingStore } from '../../stores/setting.ts'

const settingStore = useSettingStore()
</script>

<template>
  <div>
    <SettingItem :mainTitle="$t('sound_effect')" />
    <SettingItem :title="$t('auto_play_sentence')">
      <Switch v-model="settingStore.articleSound" />
    </SettingItem>
    <SettingItem :title="$t('play_next_after_end')">
      <Switch v-model="settingStore.articleAutoPlayNext" />
    </SettingItem>
    <SettingItem :title="$t('volume')">
      <Slider v-model="settingStore.articleSoundVolume" showText showValue unit="%" />
    </SettingItem>
    <SettingItem :title="$t('speed')">
      <Slider v-model="settingStore.articleSoundSpeed" :step="0.1" :min="0.5" :max="3" showText showValue />
    </SettingItem>

    <div class="line"></div>
    <SettingItem :title="$t('ignore_symbols_numbers_names')">
      <Switch v-model="settingStore.ignoreSymbol" />
    </SettingItem>
  </div>
</template>

<style scoped lang="scss"></style>
