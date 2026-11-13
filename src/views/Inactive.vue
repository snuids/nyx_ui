<template>
  <div class="inactive-page">
    <div class="inactive-card">
      <h1>{{ $t('user.inactive_page.title') }}</h1>
      <p class="lead">{{ $t('user.inactive_page.message') }}</p>
      <p class="hint">{{ $t('user.inactive_page.hint') }}</p>
      <el-button type="primary" @click="backToSignIn">{{ $t('user.inactive_page.back') }}</el-button>
    </div>
  </div>
</template>

<script>
/**
 * The page an inactive account is sent to.
 *
 * The sign-in form cannot help it: the account exists and its password is right, it is the account
 * that is disabled. Showing the refusal on the form would invite the user to try again and again, so
 * the login route sends them here, with what to do next.
 */
export default {
  name: 'Inactive',
  methods: {
    backToSignIn() {
      this.$router.push('/')
    },
  },
}
</script>

<style scoped>
.inactive-page {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: 24px;
  background: var(--nyx-bg, #f5f7fa);
}

.inactive-card {
  max-width: 560px;
  padding: 32px 40px;
  text-align: left;
  background: var(--nyx-surface, #ffffff);
  border-radius: 6px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.12);
}

.inactive-card h1 {
  margin: 0 0 16px;
  font-size: 22px;
  color: var(--el-text-color-primary, #303133);
}

.inactive-card .lead {
  margin: 0 0 12px;
  font-size: 15px;
  line-height: 1.5;
  color: var(--el-text-color-regular, #606266);
}

.inactive-card .hint {
  margin: 0 0 24px;
  font-size: 14px;
  line-height: 1.5;
  color: var(--el-text-color-secondary, #909399);
}
</style>
