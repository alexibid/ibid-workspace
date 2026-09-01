export interface AppShellSelectors {
  readonly scrollContainer: string;
  readonly loadingCurtain: string;
}

export const DEFAULT_APP_SHELL: AppShellSelectors = {
  scrollContainer: '.app-sidenav-content',
  loadingCurtain: '.o-loading-curtain--visible',
};
