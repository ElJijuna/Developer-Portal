# Changelog

All notable changes to this project will be documented in this file.

## [1.20.0](https://github.com/ElJijuna/Developer-Portal/compare/v1.19.0...v1.20.0) (2026-06-01)

### Features

* add GithubRepositoryLanguages block with language distribution bar ([2e3d24d](https://github.com/ElJijuna/Developer-Portal/commit/2e3d24d9b0bca54923ad7680af6338dbbea58fbf))
* add GithubRepositoryLanguages block with language distribution bar ([a85424d](https://github.com/ElJijuna/Developer-Portal/commit/a85424dd1a4c6282407d2334d867a5a63529bdce))

## [1.19.0](https://github.com/ElJijuna/Developer-Portal/compare/v1.18.0...v1.19.0) (2026-05-31)

### Features

* add hover preview popover to footer widgets and floaty open button to profile card ([072bac2](https://github.com/ElJijuna/Developer-Portal/commit/072bac2f78967880c2aca4e6e02241f8586c0a8a))

## [1.18.0](https://github.com/ElJijuna/Developer-Portal/compare/v1.17.0...v1.18.0) (2026-05-30)

### Features

* add reusable GitHub blocks ([8a15b55](https://github.com/ElJijuna/Developer-Portal/commit/8a15b55e15f23598075acd18d41963755e15146e))
* update dependencies and add monitor system component ([65f1cd5](https://github.com/ElJijuna/Developer-Portal/commit/65f1cd50ea43c4d36290fdf6203d1a9679546a11))

### Code Refactoring

* remove RepoDataTabs component a integrate content in repo layout ([c364199](https://github.com/ElJijuna/Developer-Portal/commit/c3641998a9b353b77c6cd47adcddad225348ab2d))
* rename components to more descriptive component name ([f4dcd6e](https://github.com/ElJijuna/Developer-Portal/commit/f4dcd6e490164c637a5a4a66fcaf61d68d5c537d))
* use github blocks in repository detail tabs ([a02dd59](https://github.com/ElJijuna/Developer-Portal/commit/a02dd59e453ae562368877f9b8c5d7db38c12b94))

## [1.17.0](https://github.com/ElJijuna/Developer-Portal/compare/v1.16.0...v1.17.0) (2026-05-25)

### Features

* integrate floaty-widget for detachable DORA metric cards ([187690b](https://github.com/ElJijuna/Developer-Portal/commit/187690be68b699617e6a386100201772be68fcc8))

## [1.16.0](https://github.com/ElJijuna/Developer-Portal/compare/v1.15.0...v1.16.0) (2026-05-25)

### Features

* add TanStack DB collections layer and optimistic inbox mutations ([dc5ade1](https://github.com/ElJijuna/Developer-Portal/commit/dc5ade1989d2387bf2ee3d8150eeefb208b4e66c))
* change strategy to offline fist using indexed db and tanstack storage persister ([e8c84d0](https://github.com/ElJijuna/Developer-Portal/commit/e8c84d0fd2a430fef7b1c419b927cd50e5ac9ee4))

## [1.15.0](https://github.com/ElJijuna/Developer-Portal/compare/v1.14.0...v1.15.0) (2026-05-25)

### Features

* refactor useRepoNamePackages to use external libraries and fix proccess to identify real package name published in npm from repository name, update Repo page to show RepoContributionGraph ([d3bccdb](https://github.com/ElJijuna/Developer-Portal/commit/d3bccdb7ab9476b1c7e45d4eeedf5aeb9d37a519))

### Bug Fixes

* change Suspense fallback element ([1abce5f](https://github.com/ElJijuna/Developer-Portal/commit/1abce5f6f41cfd48e2c2b69aea103e25c80a9945))

## [1.14.0](https://github.com/ElJijuna/Developer-Portal/compare/v1.13.0...v1.14.0) (2026-05-24)

### Features

* add component UserProfileSummaryCard to centralize how to show and what user info show in card ([235cc63](https://github.com/ElJijuna/Developer-Portal/commit/235cc63f1fc7eca4a80ebaa7b5fbe31f74ad1c56))
* increase marginTop in all pages ([960eeb6](https://github.com/ElJijuna/Developer-Portal/commit/960eeb6adb4761db0320a1188e3daa3bf3b3f268))

### Code Refactoring

* moved hero section to isolate component and add call to show summary from npm in Drawer ([828f4ab](https://github.com/ElJijuna/Developer-Portal/commit/828f4ab9f72af7c286832c2b4b721059f5030157))
* unify components and functionalities in RepositoryCard ([a41f4e0](https://github.com/ElJijuna/Developer-Portal/commit/a41f4e04f3a7aedc4a8082b33dcbc237b84bd0fd))
* update following page to use new componente UserProfileSummaryCard and update tabs to show in property counts values ([0958ee7](https://github.com/ElJijuna/Developer-Portal/commit/0958ee7879fd48d3acacfde32b58e4961da79ae0))

## [1.13.0](https://github.com/ElJijuna/Developer-Portal/compare/v1.12.0...v1.13.0) (2026-05-23)

### Features

* add NpmMaintainer componente and event to open Drawer to show maintainer information ([461117d](https://github.com/ElJijuna/Developer-Portal/commit/461117da62c809d4ccde682ad9a2387988d87d27))
* add support to monorepo npm based in packages directory ([70a7b70](https://github.com/ElJijuna/Developer-Portal/commit/70a7b70b0f647d348ae10cdda94a0a5060f8e9d9))

## [1.12.0](https://github.com/ElJijuna/Developer-Portal/compare/v1.11.0...v1.12.0) (2026-05-23)

### Features

* update CiCd page with DORA metric computed values ([f9d9a86](https://github.com/ElJijuna/Developer-Portal/commit/f9d9a86372a859fbcea074c658999cf0f7c2f894))

### Code Refactoring

* change to masonry grid and change DoraMetricCard to use PanelCard ([2216531](https://github.com/ElJijuna/Developer-Portal/commit/2216531250ea3f6b1db161069b10a94747b4e726))
* separate in childs components and update to use code-language api from hook. ([23d1c7f](https://github.com/ElJijuna/Developer-Portal/commit/23d1c7fe7dbf578c9036fdd62d76b1045b957969))

## [1.11.0](https://github.com/ElJijuna/Developer-Portal/compare/v1.10.0...v1.11.0) (2026-05-22)

### Features

* add tab Branches in repo ([6c67840](https://github.com/ElJijuna/Developer-Portal/commit/6c67840d42f67755faf33399ceb439927934dc51))

## [1.10.0](https://github.com/ElJijuna/Developer-Portal/compare/v1.9.0...v1.10.0) (2026-05-22)

### Features

* update with last version of code-languages ([983094c](https://github.com/ElJijuna/Developer-Portal/commit/983094c3f23751d56210e4b1b57b3f9f575eefeb))

## [1.9.0](https://github.com/ElJijuna/Developer-Portal/compare/v1.8.0...v1.9.0) (2026-05-22)

### Features

* add more counters in repositories ([69dfc00](https://github.com/ElJijuna/Developer-Portal/commit/69dfc00214e53f1cba638048ba024aecd94122b9))
* add validation to npm and show drawer ([eb2e3ec](https://github.com/ElJijuna/Developer-Portal/commit/eb2e3ec291d835621f998bc775f36336372a3480))
* create RepositoryCard and refacto dashboard page to use ([95759c1](https://github.com/ElJijuna/Developer-Portal/commit/95759c10f02914b1878cdf00036af10cf54982cb))
* implement NpmPackageSummary first version ([2781d33](https://github.com/ElJijuna/Developer-Portal/commit/2781d33e9c4dcc0565fbaac2bb32a0721664bd9f))
* update repositories list with RepositoryCard ([0c5b9e2](https://github.com/ElJijuna/Developer-Portal/commit/0c5b9e214140359092e0704e4b6c4f05461b82a9))

## [1.8.0](https://github.com/ElJijuna/Developer-Portal/compare/v1.7.0...v1.8.0) (2026-05-21)

### Features

* add button to force update from pwa ([c9abe21](https://github.com/ElJijuna/Developer-Portal/commit/c9abe21ddd762ef67a060654e928b952ecdabfc6))
* add releases info in repo page ([e99abab](https://github.com/ElJijuna/Developer-Portal/commit/e99abab4a53b938f3b08a89bfbb035da6d9e0ca9))
* update [@gnome-ui](https://github.com/gnome-ui) libraria a apply minor refactor to use SparkCharts ([8f95a64](https://github.com/ElJijuna/Developer-Portal/commit/8f95a64058ad064487ef42a3ee2b0c9b1905fe88))
* update advisory page to move bar ([6c4bb0d](https://github.com/ElJijuna/Developer-Portal/commit/6c4bb0dfa7155cef0e427649aac772a10e04c135))
* update authenticated page to move profile settings and signout in user popover ([98e4469](https://github.com/ElJijuna/Developer-Portal/commit/98e4469383dd7306fc048a6e445ce3a3401a39f4))
* update insights and repo workflow tab ([b900763](https://github.com/ElJijuna/Developer-Portal/commit/b90076306cd7641a60baa4f702cfb08e32c6215f))

## [1.7.0](https://github.com/ElJijuna/Developer-Portal/compare/v1.6.0...v1.7.0) (2026-05-21)

### Features

* add pages github advisory and repositories page. ([0fff636](https://github.com/ElJijuna/Developer-Portal/commit/0fff63657595da43004dd5fd0593af57033255f8))

### Bug Fixes

* correct tab navigation and add pull requests and workflows tabs to repository detail ([8def731](https://github.com/ElJijuna/Developer-Portal/commit/8def731fe361821b43b283a1cc10ed8de6eeb76a))

## [1.6.0](https://github.com/ElJijuna/Developer-Portal/compare/v1.5.0...v1.6.0) (2026-05-20)

### Features

* add appearance settings — theme, accent color, glass effect ([de51028](https://github.com/ElJijuna/Developer-Portal/commit/de5102855983441816759637c5cd20bebabce062))
* implement gitdeck features — Inbox, Issues, PRs, CI/CD, Insights ([c769efe](https://github.com/ElJijuna/Developer-Portal/commit/c769efeb6b9f863112fdbb394e1f1b925a237e24))
* remove local cofig to glass theme and update scope to access from github ([426525f](https://github.com/ElJijuna/Developer-Portal/commit/426525f96a9d1ec453706e006f55976817b8bc56))

## [1.5.0](https://github.com/ElJijuna/Developer-Portal/compare/v1.4.0...v1.5.0) (2026-05-17)

### Features

* update classes to transparent layout. ([8bb6d53](https://github.com/ElJijuna/Developer-Portal/commit/8bb6d53098b00c73b28ad7c252f44e14ab623d1f))
* update profile page ([35ec1e6](https://github.com/ElJijuna/Developer-Portal/commit/35ec1e6b38cebd7509e82740fb56bd2932ac7450))

## [1.4.0](https://github.com/ElJijuna/Developer-Portal/compare/v1.3.0...v1.4.0) (2026-05-16)

### Features

* implement GitHub network page with followers and following views ([d655d09](https://github.com/ElJijuna/Developer-Portal/commit/d655d09b3033913f7cbe9b84f417ce5c027452be))

## [1.3.0](https://github.com/ElJijuna/Developer-Portal/compare/v1.2.0...v1.3.0) (2026-05-13)

### Features

* update dashboard view ([9b52313](https://github.com/ElJijuna/Developer-Portal/commit/9b523131eee64b3c49d476a283c1c9af6c9981cf))

## [1.2.0](https://github.com/ElJijuna/Developer-Portal/compare/v1.1.0...v1.2.0) (2026-05-13)

### Features

* update dependencies ([b3f8eee](https://github.com/ElJijuna/Developer-Portal/commit/b3f8eee48cc9f209c20f83488316ffbb94f55d69))

## [1.1.0](https://github.com/ElJijuna/Developer-Portal/compare/v1.0.9...v1.1.0) (2026-04-28)

### Features

* configure PWA with service worker and web manifest ([15f2d11](https://github.com/ElJijuna/Developer-Portal/commit/15f2d11ced0ad2a79f7ce95d34c44fb6eaee704c))

## [1.0.9](https://github.com/ElJijuna/Developer-Portal/compare/v1.0.8...v1.0.9) (2026-04-28)

### Bug Fixes

* apply safe-area insets only to authenticated layout, login stays full screen. ([346338d](https://github.com/ElJijuna/Developer-Portal/commit/346338dbf46813455ea953b7a3157585e817acdd))

## [1.0.8](https://github.com/ElJijuna/Developer-Portal/compare/v1.0.7...v1.0.8) (2026-04-27)

### Bug Fixes

* change wallpaper from body to html. ([0a172b9](https://github.com/ElJijuna/Developer-Portal/commit/0a172b94774637ae5cd6d2769f0821f833c9a4cb))
* use 100dvh for correct viewport height on mobile Safari. ([9090dca](https://github.com/ElJijuna/Developer-Portal/commit/9090dcae00c47a8e3b1fa6f4400217ba7e0493d6))

## [1.0.7](https://github.com/ElJijuna/Developer-Portal/compare/v1.0.6...v1.0.7) (2026-04-27)

### Bug Fixes

* remove double slash in SPA redirect path restoration ([2a93d16](https://github.com/ElJijuna/Developer-Portal/commit/2a93d16f03db51eafb73d6710ef06b5161efce0e))

## [1.0.6](https://github.com/ElJijuna/Developer-Portal/compare/v1.0.5...v1.0.6) (2026-04-27)

### Bug Fixes

* use pathname instead of href for login redirect to prevent URL accumulation ([f9e16e5](https://github.com/ElJijuna/Developer-Portal/commit/f9e16e56b7c5eb863404d2e3a3caa806b7da1a6d))

## [1.0.5](https://github.com/ElJijuna/Developer-Portal/compare/v1.0.4...v1.0.5) (2026-04-27)

### Bug Fixes

* update redirection from 404 ([bfa1a9e](https://github.com/ElJijuna/Developer-Portal/commit/bfa1a9e9654901e01ce02ae0ea4863cf313a42cc))

## [1.0.4](https://github.com/ElJijuna/Developer-Portal/compare/v1.0.3...v1.0.4) (2026-04-27)

### Bug Fixes

* add GitHub Pages SPA redirect to support deep link reloads ([a29a5d5](https://github.com/ElJijuna/Developer-Portal/commit/a29a5d5620ed04ee96dff3e9909f2f41c98a3926))

## [1.0.3](https://github.com/ElJijuna/Developer-Portal/compare/v1.0.2...v1.0.3) (2026-04-27)

### Bug Fixes

* exclude TanStack Router DevTools from production build. ([9f782aa](https://github.com/ElJijuna/Developer-Portal/commit/9f782aa8297afefe7a6037f18b686a5199b35af9))

## [1.0.2](https://github.com/ElJijuna/Developer-Portal/compare/v1.0.1...v1.0.2) (2026-04-27)

### Bug Fixes

* **ci:** use correct TanStack Router CLI command to generate route tree ([54cdeb2](https://github.com/ElJijuna/Developer-Portal/commit/54cdeb254156e7b30e8c3e19d17e60f278a15d6f))

## [1.0.1](https://github.com/ElJijuna/Developer-Portal/compare/v1.0.0...v1.0.1) (2026-04-27)

### Bug Fixes

* **ci:** generate TanStack Router route tree before build in Pages workflow. ([70dd567](https://github.com/ElJijuna/Developer-Portal/commit/70dd567700fa6d710273b56d3fbace50ee05a51d))

## 1.0.0 (2026-04-27)

### Features

* login UI refactor, glass card, scroll fix & SVG favicon (closes [#1](https://github.com/ElJijuna/Developer-Portal/issues/1)) ([54c054b](https://github.com/ElJijuna/Developer-Portal/commit/54c054bb4de44789abb6a4179c497b485b96b078))
* login UI refactor, glass card, scroll fix & SVG favicon (closes [#1](https://github.com/ElJijuna/Developer-Portal/issues/1)) ([31540eb](https://github.com/ElJijuna/Developer-Portal/commit/31540ebf82feee7e280e1fb4c7ce6804a9b62821))
