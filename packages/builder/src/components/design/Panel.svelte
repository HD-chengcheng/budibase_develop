<script>
  import { Icon, Heading } from "@budibase/bbui"

  export let title
  export let icon
  export let expandable = false
  export let showAddButton = false
  export let showBackButton = false
  export let showCloseButton = false
  export let onClickAddButton
  export let onClickBackButton
  export let onClickCloseButton
  export let borderLeft = false
  export let borderRight = false

  let wide = false
  $: customHeaderContent = $$slots["panel-header-content"]
</script>

<div class="panel" class:wide class:borderLeft class:borderRight>
  <div class="header" class:custom={customHeaderContent}>
    {#if showBackButton}
      <Icon name="ArrowLeft" hoverable on:click={onClickBackButton} />
    {/if}
    {#if icon}
      <Icon name={icon} />
    {/if}
    <div class="title">
      <Heading size="XXS">{title || ""}</Heading>
    </div>
    {#if expandable}
      <Icon
        name={wide ? "Minimize" : "Maximize"}
        hoverable
        on:click={() => (wide = !wide)}
      />
    {/if}
    {#if showAddButton}
      <div class="add-button" on:click={onClickAddButton}>
        <Icon name="Add" />
      </div>
    {/if}
    {#if showCloseButton}
      <Icon name="Close" hoverable on:click={onClickCloseButton} />
    {/if}
  </div>

  {#if customHeaderContent}
    <span class="custom-content-wrap">
      <slot name="panel-header-content" />
    </span>
  {/if}

  <div class="body">
    <slot />
  </div>
</div>

<style>
  .panel {
    width: 260px;
    flex: 0 0 260px;
    background: var(--background);
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
    align-items: stretch;
    transition: width 130ms ease-out;
  }
  .panel.borderLeft {
    border-left: var(--border-light);
  }
  .panel.borderRight {
    border-right: var(--border-light);
  }
  .panel.wide {
    width: 420px;
    flex: 0 0 420px;
  }
  .header {
    flex: 0 0 48px;
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
    padding: 0 var(--spacing-l);
    border-bottom: var(--border-light);
    gap: var(--spacing-l);
  }
  .title {
    flex: 1 1 auto;
    width: 0;
  }
  .title :global(h1) {
    overflow: hidden;
    font-weight: 600;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .add-button {
    flex: 0 0 30px;
    height: 30px;
    display: grid;
    place-items: center;
    border-radius: 4px;
    position: relative;
    cursor: pointer;
    background: var(--spectrum-semantic-cta-color-background-default);
    transition: background var(--spectrum-global-animation-duration-100, 130ms)
      ease-out;
  }
  .add-button:hover {
    background: var(--spectrum-semantic-cta-color-background-hover);
  }
  .add-button :global(svg) {
    fill: white;
  }
  .body {
    flex: 1 1 auto;
    overflow: auto;
    overflow-x: hidden;
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
    align-items: stretch;
  }
  .header.custom {
    border: none;
  }
  .custom-content-wrap {
    border-bottom: var(--border-light);
  }
</style>
