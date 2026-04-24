declare module '*.scss'
declare module '*.css'

// Ambient declarations for @buildery/* workspace libs. Their source lives
// in libs/ui-kit, libs/styles-kit, etc. (via pnpm-workspace + submodules),
// but we intentionally do NOT add a tsconfig `paths` entry for them because
// vue-tsc would then type-check their source against hule's strict tsconfig
// and fail on lint-level issues that aren't ours to fix. Vite still resolves
// them at runtime through vite.aliases.ts. Components are typed loosely here.

declare module '@buildery/ui-kit' {
  import type { Plugin } from 'vue'
  export const uiKit: Plugin
  export const TOAST_CONFIG: Record<string, unknown>
}

declare module '@buildery/ui-kit/components' {
  import type { DefineComponent } from 'vue'
  type AnyComp = DefineComponent<Record<string, unknown>, Record<string, unknown>, Record<string, unknown>>
  export const UiButton: AnyComp
  export const UiIconButton: AnyComp
  export const UiLinkButton: AnyComp
  export const UiButtonContainer: AnyComp
  export const UiButtonGroup: AnyComp
  export const UiInput: AnyComp
  export const UiInputPassword: AnyComp
  export const UiSearch: AnyComp
  export const UiRawInput: AnyComp
  export const UiInputWrapper: AnyComp
  export const UiBaseSelect: AnyComp
  export const UiBaseSelectButton: AnyComp
  export const UiCombobox: AnyComp
  export const UiListbox: AnyComp
  export const UiListboxOption: AnyComp
  export const UiListboxCustomOption: AnyComp
  export const UiListboxEmptyOption: AnyComp
  export const UiCheckbox: AnyComp
  export const UiRadio: AnyComp
  export const UiRadioGroup: AnyComp
  export const UiRadioButton: AnyComp
  export const UiModal: AnyComp
  export const UiDeleteModal: AnyComp
  export const UiPopover: AnyComp
  export const UiPopoverTrigger: AnyComp
  export const UiPopoverPanel: AnyComp
  export const UiSpinner: AnyComp
  export const UiIcon: AnyComp
  export const UiTag: AnyComp
  export const UiCard: AnyComp
  export const UiTabSet: AnyComp
  export const UiTab: AnyComp
  export const UiTreeView: AnyComp
  export const UiTreeViewItem: AnyComp
}

declare module '@buildery/ui-kit/compose' {
  export const useClickOutside: (...args: unknown[]) => unknown
  export const useDropdownPosition: (...args: unknown[]) => unknown
  export const useBodyScrollState: (...args: unknown[]) => unknown
  export const useCalloutsState: (...args: unknown[]) => unknown
}

declare module '@buildery/ui-kit/configs' {
  export const TOAST_CONFIG: Record<string, unknown>
}

declare module '@buildery/ui-kit/types' {
  export type ElementColor = 'blue' | 'green' | 'orange' | 'red' | 'gray' | 'purple'
  export type ElementFillType = 'text' | 'tonal' | 'outlined' | 'filled' | 'outlined-tonal' | 'filled-outlined-tonal'
  export type Size = 'small-xxx' | 'small-xx' | 'small-x' | 'small' | 'medium' | 'large' | 'large-x' | 'large-xx'
}
