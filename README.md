# Steganography
This project can hide ASCII text within image files, and it can read the text that it has hidden in an image file.

To use the app, open the app [here](https://chartung17.github.io/steganography/), then enter the URL of an image file in the first text area. If you wish to use a local file, you can upload it using a file sharing service such as [file.io](https://www.file.io/).

To hide text in an image, enter either the text or the URL of a file containing the text in the second text area, then press either the "Hide Text" or "Hide Text From File" button as appropriate. If the text was successfully hidden, a file.io link will be displayed; the image file containing the hidden text can be downloaded from that link. Note that file.io links are single-use only; the image will be deleted from the server after it is downloaded, or after two weeks if it is not downloaded within that time. If the text was not successfully hidden, an error message will be displayed instead.

To reveal hidden text, press the "Read Hidden Message" button. If a hidden message is found, it will be displayed, otherwise an error message will be displayed.
