# Project TODO

- [x] Inspect the current main branch, GitHub permissions, and production configuration before modifying the repository.
- [x] Port the compact OpenDota item-name cache fix to the Next.js codebase and confirm Draft Lab item builds use real names.
- [x] Add the Draft Lab, CS2, gallery, and fictional-satire data model changes in a Prisma-compatible migration without damaging existing Neon data.
- [x] Integrate the new routes and interfaces into the existing NISHETA navigation and visual system.
- [x] Run the main project’s type-check/build and validate affected pages before committing.
- [x] Create and push a GitHub commit to the main repository for Vercel deployment.
- [x] Retire the failing admin gallery upload workflow so the public gallery has no photo upload path.
- [x] Verify the read-only gallery behavior and production build before pushing the fix.
- [x] Replace the admin-upload gallery experience with a read-only gallery using the five supplied photos.
- [x] Add the supplied gallery assets to the deployed site without storing binaries in the Git repository.
- [x] Remove public fictional-material warning copy from the satire feed while preserving private admin review controls.
- [x] Add the requested homepage photo caption and verify all affected routes before pushing the update.
- [x] Remove stale `.next` route types after retiring gallery upload handlers.
- [x] Fix readonly gallery asset typing and satire template selector state before the final build.
- [x] Replace the homepage hero image with the newly supplied NISHETA team photo.
- [x] Remove the CS2 route and all CS2 navigation/entry links without affecting Dota and lobby routes.
- [x] Verify the homepage, navigation, gallery, and production build before pushing the update.
- [x] Remove stale `.next` CS2 route types after deleting the CS2 page.
