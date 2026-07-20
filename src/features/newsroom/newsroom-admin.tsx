/**
 * newsroom-admin.tsx — barrel re-export
 *
 * All admin components have been extracted into focused sub-modules:
 *   - newsroom-admin-publications.tsx  → HomepageAdmin, PublicationsAdmin
 *   - newsroom-admin-taxonomy.tsx      → CategoriesAdmin, TagsAdmin, AuthorsAdmin
 *   - newsroom-admin-subscribers.tsx   → SubscribersAdmin
 *   - newsroom-admin-ads.tsx           → AdsCompaniesAdmin, AdsPlacementsAdmin,
 *                                         AdsCampaignsAdmin, AdsCreativesAdmin,
 *                                         AdvertisingAdmin
 *
 * All 11 admin pages that import from this barrel continue to work unchanged.
 */

export { HomepageAdmin, PublicationsAdmin } from "@/features/newsroom/newsroom-admin-publications";
export { AuthorsAdmin, CategoriesAdmin, TagsAdmin } from "@/features/newsroom/newsroom-admin-taxonomy";
export { SubscribersAdmin } from "@/features/newsroom/newsroom-admin-subscribers";
export {
  AdvertisingAdmin,
  AdsCampaignsAdmin,
  AdsCompaniesAdmin,
  AdsCreativesAdmin,
  AdsPlacementsAdmin,
} from "@/features/newsroom/newsroom-admin-ads";
