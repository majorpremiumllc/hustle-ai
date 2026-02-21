# Upload iPad Screenshots to App Store Connect
---
description: Upload prepared iPad screenshots to App Store Connect using Fastlane.
---

## Prerequisites
1. **Fastlane installed** – if not installed, run:
   ```bash
   sudo gem install fastlane -NV
   ```
2. **App Store Connect credentials** – Apple ID, app-specific password, and the app's bundle identifier.
3. **Screenshots** – place your iPad screenshots (portrait and landscape) in a folder, e.g. `./fastlane/screenshots/ios/ipad`.
   - Naming convention: `AppName_iPad_1.png`, `AppName_iPad_2.png`, …
   - Ensure the images are PNG or JPEG and meet Apple’s size requirements (e.g., 1668 × 2224 px for iPad Pro).

## Fastlane Setup
Create (or edit) `Fastfile` in the `fastlane` directory:
```ruby
fastlane_version "2.219.0"

default_platform(:ios)

  lane :upload_screenshots do
    # Authenticate with App Store Connect
    app_identifier = "com.yourcompany.hustleai" # replace with your bundle ID
    apple_id = "your_apple_id@example.com"   # replace with your Apple ID
    app_password = "xxxxxxxxxxxx"            # app‑specific password

    # Upload screenshots
    upload_screenshots(
      username: apple_id,
      app_identifier: app_identifier,
      screenshots_path: "./fastlane/screenshots/ios/ipad",
      skip_metadata: true,
      skip_binary_upload: true,
      force: true,
      app_password: app_password
    )
  end
end
```

## Execution
1. Open a terminal in the project root (`/Users/artem/Desktop/Hustle Ai/servicebot`).
2. Run the lane:
   ```bash
   fastlane ios upload_screenshots
   ```
   Fastlane will upload the screenshots to the latest version of your app in App Store Connect.

## Tips
- If you have multiple app versions, specify `app_version` in `upload_screenshots`.
- Verify the upload in App Store Connect → **App Store** → **iOS App** → **Screenshots**.
- For automation, you can add this lane to your CI pipeline.

---
*This workflow is a concise guide; adjust paths and identifiers to match your project.*
