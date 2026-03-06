#!/usr/bin/env node
/**
 * Patches expo-router's iOS LinkPreview files so they compile against
 * react-native-screens versions that don't yet ship RNSBottomTabs* classes
 * or the screenIds / screenId properties.
 *
 * This replaces a patch-package patch which was too brittle (line-number
 * sensitive). This script uses string matching so it survives minor upstream
 * changes to the file.
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

  // 1. Insert compatibility stubs after the last RNScreens import if not already present
  if (!mm.includes("RNSBottomTabsScreenComponentView_defined")) {
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

console.log("expo-router iOS patch complete.");
