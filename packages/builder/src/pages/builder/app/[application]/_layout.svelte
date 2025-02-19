<script>
  import { store, automationStore } from "builderStore"
  import { roles, flags } from "stores/backend"
  import { auth } from "stores/portal"
  import { TENANT_FEATURE_FLAGS, isEnabled } from "helpers/featureFlags"
  import {
    ActionMenu,
    MenuItem,
    Icon,
    Tabs,
    Tab,
    Heading,
    notifications,
  } from "@budibase/bbui"

  import AppActions from "components/deploy/AppActions.svelte"
  import { API } from "api"
  import { isActive, goto, layout, redirect } from "@roxi/routify"
  import { capitalise } from "helpers"
  import { onMount, onDestroy } from "svelte"
  import TourWrap from "components/portal/onboarding/TourWrap.svelte"
  import TourPopover from "components/portal/onboarding/TourPopover.svelte"
  import BuilderSidePanel from "./_components/BuilderSidePanel.svelte"
  import { TOUR_KEYS, TOURS } from "components/portal/onboarding/tours.js"

  export let application

  // Get Package and set store
  let promise = getPackage()
  // let betaAccess = false

  // Sync once when you load the app
  let hasSynced = false

  $: selected = capitalise(
    $layout.children.find(layout => $isActive(layout.path))?.title ?? "data"
  )

  async function getPackage() {
    try {
      store.actions.reset()
      const pkg = await API.fetchAppPackage(application)
      await store.actions.initialise(pkg)
      await automationStore.actions.fetch()
      await roles.fetch()
      await flags.fetch()
      return pkg
    } catch (error) {
      notifications.error(`Error initialising app: ${error?.message}`)
      $redirect("../../")
    }
  }

  // Handles navigation between frontend, backend, automation.
  // This remembers your last place on each of the sections
  // e.g. if one of your screens is selected on front end, then
  // you browse to backend, when you click frontend, you will be
  // brought back to the same screen.
  const topItemNavigate = path => () => {
    const activeTopNav = $layout.children.find(c => $isActive(c.path))
    if (!activeTopNav) return
    store.update(state => {
      if (!state.previousTopNavPath) state.previousTopNavPath = {}
      state.previousTopNavPath[activeTopNav.path] = window.location.pathname
      $goto(state.previousTopNavPath[path] || path)
      return state
    })
  }

  const initTour = async () => {
    // Check if onboarding is enabled.
    if (isEnabled(TENANT_FEATURE_FLAGS.ONBOARDING_TOUR)) {
      if (!$auth.user?.onboardedAt) {
        // Determine the correct step
        const activeNav = $layout.children.find(c => $isActive(c.path))
        const onboardingTour = TOURS[TOUR_KEYS.TOUR_BUILDER_ONBOARDING]
        const targetStep = activeNav
          ? onboardingTour.find(step => step.route === activeNav?.path)
          : null
        await store.update(state => ({
          ...state,
          onboarding: true,
          tourKey: TOUR_KEYS.TOUR_BUILDER_ONBOARDING,
          tourStepKey: targetStep?.id,
        }))
      } else {
        // Feature tour date
        const release_date = new Date("2023-03-01T00:00:00.000Z")
        const onboarded = new Date($auth.user?.onboardedAt)
        if (onboarded < release_date) {
          await store.update(state => ({
            ...state,
            tourKey: TOUR_KEYS.FEATURE_ONBOARDING,
          }))
        }
      }
    }
  }

  onMount(async () => {
    if (!hasSynced && application) {
      try {
        await API.syncApp(application)
        // check if user has beta access
        // const betaResponse = await API.checkBetaAccess($auth?.user?.email)
        // betaAccess = betaResponse.access
        initTour()
      } catch (error) {
        notifications.error("Failed to sync with production database")
      }
      hasSynced = true
    }
  })

  onDestroy(() => {
    store.update(state => {
      state.appId = null
      return state
    })
  })
</script>

<TourPopover />

{#if $store.builderSidePanel}
  <BuilderSidePanel />
{/if}

<div class="root">
  <div class="top-nav">
    <div class="topleftnav">
      <ActionMenu>
        <div slot="control">
          <Icon size="M" hoverable name="ShowMenu" />
        </div>
        <MenuItem on:click={() => $goto("../../portal/apps")}>
          Exit to portal
        </MenuItem>
        <MenuItem
          on:click={() => $goto(`../../portal/overview/${application}`)}
        >
          Overview
        </MenuItem>
        <MenuItem
          on:click={() => $goto(`../../portal/overview/${application}/access`)}
        >
          Access
        </MenuItem>
        <MenuItem
          on:click={() =>
            $goto(`../../portal/overview/${application}/automation-history`)}
        >
          Automation history
        </MenuItem>
        <MenuItem
          on:click={() => $goto(`../../portal/overview/${application}/backups`)}
        >
          Backups
        </MenuItem>

        <MenuItem
          on:click={() =>
            $goto(`../../portal/overview/${application}/name-and-url`)}
        >
          Name and URL
        </MenuItem>
        <MenuItem
          on:click={() => $goto(`../../portal/overview/${application}/version`)}
        >
          Version
        </MenuItem>
      </ActionMenu>
      <Heading size="XS">{$store.name}</Heading>
    </div>
    <div class="topcenternav">
      <Tabs {selected} size="M">
        {#each $layout.children as { path, title }}
          <TourWrap tourStepKey={`builder-${title}-section`}>
            <Tab
              quiet
              selected={$isActive(path)}
              on:click={topItemNavigate(path)}
              title={capitalise(title)}
              id={`builder-${title}-tab`}
            />
          </TourWrap>
        {/each}
      </Tabs>
    </div>
    <div class="toprightnav">
      <AppActions {application} />
    </div>
  </div>
  {#await promise}
    <!-- This should probably be some kind of loading state? -->
    <div class="loading" />
  {:then _}
    <slot />
  {:catch error}
    <p>Something went wrong: {error.message}</p>
  {/await}
</div>

<style>
  .loading {
    min-height: 100%;
    height: 100%;
    width: 100%;
    background: var(--background);
  }
  .root {
    min-height: 100%;
    height: 100%;
    width: 100%;
    display: flex;
    flex-direction: column;
  }

  .top-nav {
    flex: 0 0 60px;
    background: var(--background);
    padding: 0 var(--spacing-xl);
    display: grid;
    grid-template-columns: 1fr auto 1fr;
    flex-direction: row;
    box-sizing: border-box;
    align-items: stretch;
    border-bottom: var(--border-light);
  }

  .topleftnav {
    display: flex;
    flex-direction: row;
    justify-content: flex-start;
    align-items: center;
    gap: var(--spacing-xl);
  }
  .topleftnav :global(.spectrum-Heading) {
    flex: 1 1 auto;
    width: 0;
    font-weight: 600;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .topcenternav {
    display: flex;
    position: relative;
    margin-bottom: -2px;
  }
  .topcenternav :global(.spectrum-Tabs-itemLabel) {
    font-weight: 600;
  }

  .toprightnav {
    display: flex;
    flex-direction: row;
    justify-content: flex-end;
    align-items: center;
    gap: var(--spacing-l);
  }
</style>
