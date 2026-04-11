import { lazy, ComponentType } from 'react'

export interface PluginDefinition {
  id: string
  component: ComponentType<any>
  isEcommerce?: boolean
}

const SlidersAdmin     = lazy(() => import('../pages/Plugins/SlidersAdmin'))
const MenusAdmin       = lazy(() => import('../pages/Plugins/MenusAdmin'))
const CommentsAdmin    = lazy(() => import('../pages/Plugins/CommentsAdmin'))
const CategoriesAdmin  = lazy(() => import('../pages/Plugins/CategoriesAdmin'))
const WebhooksAdmin    = lazy(() => import('../pages/Plugins/WebhooksAdmin'))
const BackupAdmin      = lazy(() => import('../pages/Plugins/BackupAdmin'))
const UpdatesAdmin     = lazy(() => import('../pages/Plugins/UpdatesAdmin'))
const CacheAdmin       = lazy(() => import('../pages/Plugins/CacheAdmin'))
const CouponsAdmin     = lazy(() => import('../pages/Plugins/CouponsAdmin'))
const ContactFormsAdmin = lazy(() => import('../pages/Plugins/ContactFormsAdmin'))
const NewsletterAdmin  = lazy(() => import('../pages/Plugins/NewsletterAdmin'))
const RedirectsAdmin   = lazy(() => import('../pages/Plugins/RedirectsAdmin'))
const HealthDashboard  = lazy(() => import('../pages/Dashboard/HealthDashboard'))

export const PLUGIN_REGISTRY: Record<string, PluginDefinition> = {
  sliders:    { id: 'sliders',    component: SlidersAdmin },
  menus:      { id: 'menus',      component: MenusAdmin },
  comments:   { id: 'comments',   component: CommentsAdmin },
  categories: { id: 'categories', component: CategoriesAdmin },
  webhooks:   { id: 'webhooks',   component: WebhooksAdmin },
  health:     { id: 'health',     component: HealthDashboard },
  ecommerce:  { id: 'ecommerce',  component: lazy(() => Promise.resolve({ default: () => null })), isEcommerce: true },
  backup:     { id: 'backup',     component: BackupAdmin },
  updates:    { id: 'updates',    component: UpdatesAdmin },
  redirects:  { id: 'redirects',  component: RedirectsAdmin },
  newsletter: { id: 'newsletter', component: NewsletterAdmin },
  contact:    { id: 'contact',    component: ContactFormsAdmin },
  coupons:    { id: 'coupons',    component: CouponsAdmin },
  cache:      { id: 'cache',      component: CacheAdmin },
}

export function isEcommercePlugin(id: string): boolean {
  return PLUGIN_REGISTRY[id]?.isEcommerce ?? false
}

export function getPluginComponent(id: string): ComponentType<any> | null {
  return PLUGIN_REGISTRY[id]?.component ?? null
}
