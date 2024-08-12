const [file, setFile] = useState(null);

<input
  type="file"
  id="upload"
  onChange={async (e) => {
    setFile(e.target.files[0]);
  }}
/>;

const onUpload = async () => {
  const fileExtension = file.name.split(".").pop();
  // Upload file to firebase storage
  const randomName = crypto.randomUUID();

  const storageRef = ref(storage, randomName + "." + fileExtension);

  await uploadBytes(storageRef, file);
  const downloadURL = await getDownloadURL(storageRef);
  changedFiles.push({
    name: file.name,
    ref: randomName + "." + fileExtension,
    downloadURL: downloadURL,
  });
};

const handleDelete = async (file) => {
  const desertRef = ref(storage, file.ref);

  // Delete the file
  await eleteObject(desertRef);
};
