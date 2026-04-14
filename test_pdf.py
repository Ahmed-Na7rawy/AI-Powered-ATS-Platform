import os

files = os.listdir("storage/resumes")
if files:
    path = os.path.join("storage/resumes", files[0])
    with open(path, "rb") as f:
        data = f.read(20)
    print("Header of", files[0], ":", data)
