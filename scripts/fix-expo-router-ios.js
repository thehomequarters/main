#!/usr/bin/env node
/**
 * Unified postinstall patch script for iOS native compatibility fixes.
 *
 * 1. expo-router iOS LinkPreview files — stubs for RNSBottomTabs* classes and
 *    screenIds/screenId properties that don't exist in react-native-screens < 4.x
 *
 * 2. expo-image-picker MediaHandler.swift — removes Swift "if expression" syntax
 *    with #available(iOS 26.0, *) that requires Xcode 16 / Swift 5.9+
 *
 * 3. @react-navigation/routers TabRouter.js — guards against undefined partialState
 *
 * Uses string matching throughout, not line numbers, so it survives minor
 * upstream changes between patch versions.
 */

const fs = require("fs");
const path = require("path");

const MM_PATH = path.join(
  __dirname,
  "..",
  "node_modules",
  "expo-router",
  "ios",
  "LinkPreview",
  "LinkPreviewNativeNavigation.mm"
);

const H_PATH = path.join(
  __dirname,
  "..",
  "node_modules",
  "expo-router",
  "ios",
  "LinkPreview",
  "LinkPreviewNativeNavigation.h"
);

// ─── Patch the .mm file ───────────────────────────────────────────────────────

if (fs.existsSync(MM_PATH)) {
  let mm = fs.readFileSync(MM_PATH, "utf8");

  // 1. Insert compatibility stubs after the last RNScreens import if not already present.
  // Also re-patch if the old stubs are present but lack @implementation blocks
  // (a previous version of this script only emitted @interface declarations).
  const needsStubs =
    !mm.includes("RNSBottomTabsScreenComponentView_defined") ||
    !mm.includes("@implementation RNSBottomTabsHostComponentView") ||
    !mm.includes("@implementation RNSTabBarController");

  if (needsStubs) {
    // Remove any old (incomplete) stubs so we can replace them cleanly
    mm = mm.replace(
      /\/\/ Compatibility stubs[\s\S]*?@interface RNSScreenView[\s\S]*?@end\n\n/,
      ""
    );
    const stubs = `
// Compatibility stubs for react-native-screens versions that lack bottom-tabs
// and per-screen ID APIs (e.g. react-native-screens < 4.x).
#ifndef RNSBottomTabsScreenComponentView_defined
#define RNSBottomTabsScreenComponentView_defined
@interface RNSBottomTabsScreenComponentView : UIView
@property (nonatomic, copy) NSString *tabKey;
- (UIViewController *)reactViewController;
@end
@implementation RNSBottomTabsScreenComponentView
@end
#endif

#ifndef RNSBottomTabsHostComponentView_defined
#define RNSBottomTabsHostComponentView_defined
@interface RNSBottomTabsHostComponentView : UIView
- (UITabBarController *)controller;
@end
@implementation RNSBottomTabsHostComponentView
@end
#endif

// RNSTabBarController stub — the @interface is declared in the .h stub,
// but the linker needs an @implementation to emit the class symbol.
@implementation RNSTabBarController
@end

// Category declarations so the compiler accepts screenIds / screenId access;
// guarded at runtime with respondsToSelector: below.
@interface RNSScreenStackView (ExpoRouterScreenIds)
- (NSArray<NSString *> *)screenIds;
@end

@interface RNSScreenView (ExpoRouterScreenId)
- (NSString *)screenId;
@end

`;
    // Insert after the last #import line in the headers block
    const lastImport = "#import <RNScreens/RNSScreenStack.h>";
    if (mm.includes(lastImport)) {
      mm = mm.replace(lastImport, lastImport + "\n" + stubs);
    }
    console.log("expo-router: inserted RNSBottomTabs* stubs into .mm");
  }

  // 2. Guard stackView.screenIds with respondsToSelector:
  if (mm.includes("return stackView.screenIds;") && !mm.includes("respondsToSelector:@selector(screenIds)")) {
    mm = mm.replace(
      "return stackView.screenIds;",
      `if ([stackView respondsToSelector:@selector(screenIds)]) {
      return stackView.screenIds;
    }`
    );
    console.log("expo-router: guarded stackView.screenIds");
  }

  // 3. Guard screenView.screenId with respondsToSelector:
  if (mm.includes("return screenView.screenId;") && !mm.includes("respondsToSelector:@selector(screenId)")) {
    mm = mm.replace(
      "return screenView.screenId;",
      `if ([screenView respondsToSelector:@selector(screenId)]) {
      return screenView.screenId;
    }`
    );
    console.log("expo-router: guarded screenView.screenId");
  }

  fs.writeFileSync(MM_PATH, mm, "utf8");
} else {
  console.warn("expo-router: .mm file not found, skipping patch");
}

// ─── Patch the .h file ────────────────────────────────────────────────────────
//
// We NEVER import from RNScreens here. Even though the headers exist,
// importing them in an ObjC-only compilation unit pulls in C++ standard
// library headers (<cstdint>, <memory>) that the compiler can't find in
// that context. Instead we always use lightweight forward stubs.

if (fs.existsSync(H_PATH)) {
  let h = fs.readFileSync(H_PATH, "utf8");

  // Replace the direct RNSDismissibleModalProtocol import (any variant) with a stub
  if (
    h.includes('#import <RNScreens/RNSDismissibleModalProtocol.h>') &&
    !h.includes("RNSDismissibleModalProtocol_stub")
  ) {
    // Replace any existing conditional block or bare import with a pure stub
    h = h.replace(
      /#if __has_include\(<RNScreens\/RNSDismissibleModalProtocol\.h>\)[\s\S]*?#endif/,
      `// RNSDismissibleModalProtocol_stub — importing from RNScreens pulls in C++ headers
@protocol RNSDismissibleModalProtocol <NSObject>
@optional
@end`
    );
    // Also handle bare (unguarded) import
    if (h.includes('#import <RNScreens/RNSDismissibleModalProtocol.h>')) {
      h = h.replace(
        '#import <RNScreens/RNSDismissibleModalProtocol.h>',
        `// RNSDismissibleModalProtocol_stub — importing from RNScreens pulls in C++ headers
@protocol RNSDismissibleModalProtocol <NSObject>
@optional
@end`
      );
    }
    console.log("expo-router: stubbed RNSDismissibleModalProtocol in .h");
  }

  // Replace the direct RNSTabBarController import (any variant) with a stub
  if (
    h.includes('#import <RNScreens/RNSTabBarController.h>') &&
    !h.includes("RNSTabBarController_stub")
  ) {
    h = h.replace(
      /#if __has_include\(<RNScreens\/RNSTabBarController\.h>\)[\s\S]*?#endif/,
      `// RNSTabBarController_stub — importing from RNScreens pulls in C++ headers
#import <UIKit/UIKit.h>
@interface RNSTabBarController : UITabBarController
@end`
    );
    if (h.includes('#import <RNScreens/RNSTabBarController.h>')) {
      h = h.replace(
        '#import <RNScreens/RNSTabBarController.h>',
        `// RNSTabBarController_stub — importing from RNScreens pulls in C++ headers
#import <UIKit/UIKit.h>
@interface RNSTabBarController : UITabBarController
@end`
      );
    }
    console.log("expo-router: stubbed RNSTabBarController in .h");
  }

  fs.writeFileSync(H_PATH, h, "utf8");
} else {
  console.warn("expo-router: .h file not found, skipping patch");
}

// ─── Patch expo-image-picker MediaHandler.swift ───────────────────────────────
//
// expo-image-picker@55.0.10+ uses Swift "if expression" syntax
// (let x = if #available(iOS 26.0, *) { … } else { … }) which requires
// Xcode 16 / Swift 5.9+. Replace both occurrences with the safe fallback form.

const MEDIA_HANDLER_PATH = path.join(
  __dirname,
  "..",
  "node_modules",
  "expo-image-picker",
  "ios",
  "MediaHandler.swift"
);

if (fs.existsSync(MEDIA_HANDLER_PATH)) {
  let swift = fs.readFileSync(MEDIA_HANDLER_PATH, "utf8");

  if (swift.includes("#available(iOS 26.0, *)")) {
    // Block 1: getMimeType(from asset: PHAsset?, ...)
    swift = swift.replace(
      `    let utType: UTType? = if #available(iOS 26.0, *) {\n      asset?.contentType ?? UTType(filenameExtension: fileExtension)\n    } else {\n      UTType(filenameExtension: fileExtension)\n    }`,
      `    let utType: UTType? = UTType(filenameExtension: fileExtension)`
    );

    // Block 2: getMimeType(from resource: PHAssetResource, ...)
    swift = swift.replace(
      `    let utType: UTType? = if #available(iOS 26.0, *) {\n      resource.contentType\n    } else {\n      UTType(resource.uniformTypeIdentifier) ?? UTType(filenameExtension: fileExtension)\n    }`,
      `    let utType: UTType? = UTType(resource.uniformTypeIdentifier) ?? UTType(filenameExtension: fileExtension)`
    );

    fs.writeFileSync(MEDIA_HANDLER_PATH, swift, "utf8");
    console.log("expo-image-picker: removed iOS 26.0 if-expression from MediaHandler.swift");
  } else {
    console.log("expo-image-picker: MediaHandler.swift already patched, skipping");
  }
} else {
  console.warn("expo-image-picker: MediaHandler.swift not found, skipping patch");
}

// ─── Patch @react-navigation/routers TabRouter.js ────────────────────────────
//
// Guards against undefined/null partialState which causes a crash when
// navigating to a tab route before state is initialised.

const TAB_ROUTER_PATH = path.join(
  __dirname,
  "..",
  "node_modules",
  "@react-navigation",
  "routers",
  "lib",
  "module",
  "TabRouter.js"
);

if (fs.existsSync(TAB_ROUTER_PATH)) {
  let tabRouter = fs.readFileSync(TAB_ROUTER_PATH, "utf8");

  if (
    tabRouter.includes("const state = partialState;") &&
    !tabRouter.includes("partialState ??")
  ) {
    tabRouter = tabRouter.replace(
      "const state = partialState;",
      `const state = partialState ?? { stale: true, routes: [], index: 0 };`
    );
    fs.writeFileSync(TAB_ROUTER_PATH, tabRouter, "utf8");
    console.log("@react-navigation/routers: guarded partialState in TabRouter.js");
  } else {
    console.log("@react-navigation/routers: TabRouter.js already patched, skipping");
  }
} else {
  console.warn("@react-navigation/routers: TabRouter.js not found, skipping patch");
}

console.log("postinstall patches complete.");
