Many projects have some sort of system where users can upload files for other users to see.
We should do our best to prevent any file based attacks.

1. The first step is to set an allow list for which types of files can be uploaded. Keep this as small as possible.
2. Next, set a maximum file size.
3. Thirdly, check that a file's extension matches its true type. We can use magic numbers (unique sequences of bytes at the start of a file that identify its format) to achieve this. Run "npm install file-type" to install a package that can quickly process a file's magic numbers. It does not provide support for .csv, .doc, .xls, .ppt, .msi, or .svg files.
4. If possible, and if the NPO has the budget (very rarely), run the files through an antivirus. This might be possible for free using ClamScan (https://www.npmjs.com/package/clamscan), but I haven't looked into it too much.
5. To prevent against some name-based attacks, name the file something different on the backend, but you can also store the file's uploaded name somewhere.
