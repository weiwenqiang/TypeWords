<script setup lang="ts">

</script>

<template>
  <div class="h-12 text-xs text-gray-400">
    <span>
      {{ $t('agree_terms_notice') }}
    <a href="/user-agreement.html" target="_blank" class="link">{{ $t('user_agreement') }}</a>
    {{ $t('and') }}
    <a href="/privacy-policy.html" target="_blank" class="link">{{ $t('privacy_policy') }}</a>
    </span>
    <slot/>
  </div>
</template>
