/**

- CloudinaryUpload.js
- ────────────────────
- Handles all image uploads to Cloudinary via the unsigned upload API.
- Returns the secure URL of the uploaded asset.
- 
- SETUP:
- 1. Create a free account at cloudinary.com
- 1. Copy your Cloud Name from the dashboard
- 1. Go to Settings → Upload → Add upload preset
- ```
  • Set "Signing Mode" to  Unsigned
  ```
- ```
  • Note the preset name
  ```
- 1. Replace CLOUD_NAME and UPLOAD_PRESET below
   */

// ─── YOUR CLOUDINARY CREDENTIALS ─────────────────────────────────
const CLOUD_NAME   = “YOUR_CLOUD_NAME”;
const UPLOAD_PRESET = “YOUR_UNSIGNED_PRESET”; // e.g. “gigscourt_unsigned”
// ─────────────────────────────────────────────────────────────────

const CLOUDINARY_URL = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`;

/**

- Upload a single File object to Cloudinary.
- 
- @param {File}   file    – browser File from <input type="file">
- @param {string} [folder] – optional sub-folder in Cloudinary, e.g. “profiles”
- @param {function} [onProgress] – called with 0-100 progress value
- @returns {Promise<string>} the secure_url of the uploaded image
  */
  async function uploadImage(file, folder = “gigscourt”, onProgress = null) {
  if (!file) throw new Error(“No file provided”);

const formData = new FormData();
formData.append(“file”,         file);
formData.append(“upload_preset”, UPLOAD_PRESET);
formData.append(“folder”,        folder);
// Optional: strip EXIF data for privacy
formData.append(“quality”, “auto:good”);
formData.append(“fetch_format”, “auto”);

return new Promise((resolve, reject) => {
const xhr = new XMLHttpRequest();
xhr.open(“POST”, CLOUDINARY_URL);

```
if (onProgress) {
  xhr.upload.addEventListener("progress", (e) => {
    if (e.lengthComputable) {
      onProgress(Math.round((e.loaded / e.total) * 100));
    }
  });
}

xhr.onload = () => {
  if (xhr.status >= 200 && xhr.status < 300) {
    const data = JSON.parse(xhr.responseText);
    resolve(data.secure_url);
  } else {
    let msg = `Cloudinary error ${xhr.status}`;
    try {
      const err = JSON.parse(xhr.responseText);
      msg = err.error?.message || msg;
    } catch (_) {}
    reject(new Error(msg));
  }
};

xhr.onerror = () => reject(new Error("Network error during upload"));
xhr.send(formData);
```

});
}

/**

- Upload a profile photo.
- Resizes to 400×400 via Cloudinary transformation query param.
- 
- @param {File} file
- @param {string} uid – user ID used to name the asset
- @param {function} [onProgress]
- @returns {Promise<string>} secure_url
  */
  async function uploadProfilePhoto(file, uid, onProgress = null) {
  validateImageFile(file);
  const url = await uploadImage(file, `gigscourt/profiles/${uid}`, onProgress);
  // Return a Cloudinary transformation URL for consistent sizing
  return buildTransformUrl(url, “w_400,h_400,c_fill,g_face,q_auto,f_auto”);
  }

/**

- Upload one work/portfolio photo.
- 
- @param {File} file
- @param {string} uid
- @param {function} [onProgress]
- @returns {Promise<string>} secure_url
  */
  async function uploadWorkPhoto(file, uid, onProgress = null) {
  validateImageFile(file);
  const url = await uploadImage(file, `gigscourt/work/${uid}`, onProgress);
  return buildTransformUrl(url, “w_800,h_600,c_fill,q_auto,f_auto”);
  }

/**

- Upload multiple work photos sequentially.
- 
- @param {FileList|File[]} files
- @param {string} uid
- @param {function} [onEachProgress]  called with (index, percent)
- @returns {Promise<string[]>} array of secure_urls
  */
  async function uploadWorkPhotos(files, uid, onEachProgress = null) {
  const results = [];
  const arr = Array.from(files);
  for (let i = 0; i < arr.length; i++) {
  const url = await uploadWorkPhoto(arr[i], uid, (pct) => {
  if (onEachProgress) onEachProgress(i, pct);
  });
  results.push(url);
  }
  return results;
  }

// ─── HELPERS ─────────────────────────────────────────────────────

/**

- Validate file is an image and under 10 MB.
  */
  function validateImageFile(file) {
  if (!file.type.startsWith(“image/”)) {
  throw new Error(“Only image files are accepted”);
  }
  if (file.size > 10 * 1024 * 1024) {
  throw new Error(“Image must be smaller than 10 MB”);
  }
  }

/**

- Inject a transformation string into an existing Cloudinary URL.
- Works for both upload and fetch URLs.
- 
- @param {string} url         – original Cloudinary secure_url
- @param {string} transforms  – e.g. “w_400,h_400,c_fill”
- @returns {string}
  */
  function buildTransformUrl(url, transforms) {
  // Cloudinary URLs look like:
  // https://res.cloudinary.com/<cloud>/image/upload/<version>/<public_id>
  // We insert transforms after /upload/
  return url.replace(”/upload/”, `/upload/${transforms}/`);
  }

/**

- Read a File as a local object URL for instant preview before upload.
- @param {File} file
- @returns {string} object URL (revoke when done)
  */
  function createLocalPreview(file) {
  return URL.createObjectURL(file);
  }

export {
uploadImage,
uploadProfilePhoto,
uploadWorkPhoto,
uploadWorkPhotos,
createLocalPreview,
buildTransformUrl,
};
