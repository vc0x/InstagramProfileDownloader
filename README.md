# Instagram Profile Downloader
This Tampermonkey script allows for downloading Instagram profiles (feed posts and videos only for now).

**✔ Tested on Chrome and Firefox**

##  Installation
1. Install the Tampermonkey browser extension: [Chrome](https://chrome.google.com/webstore/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo?hl=en) [Firefox](https://addons.mozilla.org/en-US/firefox/addon/tampermonkey/) [Brave](https://chrome.google.com/webstore/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo?hl=en)
2. **Important:** Under the tampermonkey settings, set the **Config mode** to **Advanced** and enable the **Browser API** in **Download Mode (BETA)**.
3. Copy the contents of [https://github.com/backwards221/InstagramProfileDownloader/raw/main/dist/build.user.js](https://github.com/backwards221/InstagramProfileDownloader/raw/main/dist/build.user.js)
4. Create a new Tampermonkey script and paste the contents you copied in step 3 (dist/build.user.js).
5. Save the script (Ctrl+S).
6. Visit any profile to verify the installation (Download button should appear next to the **Follow** or **Following** button).

# Output
Each profile can contain the following directories based on its contents:

- Images - All images are written to this directory.
- Videos - All videos are written to this directory.

### Chrome
For Chromium based browsers, the files are not zipped and written directly to **Instagram** folder.
Example: The profile [itskaslol](https://www.instagram.com/itskaslol) will be downloaded to:

**Default Browser Download Folder**/Instagram/itskaslol

### Firefox
For some reason, Firefox doesn't allow writing to custom directories so the profile is zipped.

Example: The profile [itskaslol](https://www.instagram.com/itskaslol) will be downloaded to:

**Default Browser Download Folder**/itskaslol.zip

# Updates
The script should automatically update from GitHub. If it doesn't, simply repeat the steps 3-6 from the installation section.

# Limitations
When navigating to a different profile, the download button does not appear. Simply refresh the page and the download button should appear. This will be addressed soon.