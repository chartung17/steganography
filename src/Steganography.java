import java.awt.image.BufferedImage;
import java.io.BufferedReader;
import java.io.File;
import java.io.IOException;
import java.io.InputStreamReader;
import java.net.URL;
import java.nio.file.Files;

import javax.imageio.ImageIO;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.web.bind.annotation.*;

@RestController
@SpringBootApplication
public class Steganography {

	/**
	 * This is class is used to convert JSON inputs from POST requests into Strings
	 */
	public static class JsonInput {
		private String imagefile, text, textfile;

		/**
		 * @return the imagefile
		 */
		public String getImagefile() {
			return imagefile;
		}

		/**
		 * @return the text
		 */
		public String getText() {
			return text;
		}

		/**
		 * @return the textfile
		 */
		public String getTextfile() {
			return textfile;
		}
	}

	/**
	 * This method is used to convert error messages into JSON format.
	 * 
	 * @param str the error message
	 * @return a JSON-formatted String with status 500 and the given message
	 */
	private static String jsonErrorWrap(String str) {
		return "{\"status\":500,\"message\":\"" + str + "\"}";
	}

	/**
	 * This method is used to add the necessary escape characters to a String so that it can be sent
	 * in JSON format.
	 * 
	 * @param str the String to escape
	 * @return the escaped String
	 */
	private static String jsonEscape(String str) {
		str = str.replaceAll("\\\\", "\\\\\\\\");
		str = str.replaceAll("\r", "");
		str = str.replaceAll("\n", "\\\\n");
		str = str.replaceAll("\t", "\\\\t");
		str = str.replaceAll("\"", "\\\\\"");
		return str;
	}

	/**
	 * Hides the given message in a copy of the given image file. The message should only contain
	 * ASCII characters, and it should not contain null characters; messages that do not follow
	 * these rules cannot be encoded correctly.
	 * 
	 * @param body the POST request body, containing an image file name and either a text String or
	 *             a text file name
	 * @return a String indicating whether the message was successfully hidden
	 */
	@RequestMapping(path = "hide", method = RequestMethod.POST)
	@CrossOrigin
	public static String hide(@RequestBody JsonInput body) {
		String str;
		if (body.getTextfile().equals("none")) {
			str = hideText(body.getImagefile(), body.getText());
		} else {
			str = hideFile(body.getImagefile(), body.getTextfile());
		}
		if (!(str.startsWith("{"))) {
			str = jsonErrorWrap(str);
		}
		return str;
	}

	/**
	 * Hides the given message in a copy of the given image file. The message should only contain
	 * ASCII characters, and it should not contain null characters; messages that do not follow
	 * these rules might not be encoded correctly.
	 * 
	 * @param filename the path to the image in which the message will be hidden
	 * @param text     the message to hide
	 * @return a String indicating whether the message was successfully hidden
	 */
	private static String hideText(String filename, String text) {
		// check if image is large enough; 3 pixels are required per character in the message
		BufferedImage image;
		try {
			image = ImageIO.read(new URL(filename));
			if (image == null)
				throw new IOException("Image not found");
		} catch (IOException e1) {
			return "Error reading file";
		}
		int width = image.getWidth();
		int height = image.getHeight();
		if ((width * height) < (3 * (text.length() + 1)))
			return "File is too small to encode the given text";

		// get the image pixels and encode the characters of the message into the pixels
		int[] colors = image.getRGB(0, 0, width, height, null, 0, width);
		int i;
		for (i = 0; i < text.length(); i++) {
			char c = text.charAt(i);
			if ((c >= 128) || (c <= 0))
				return "Error: unable to encode the given text. Valid text must only contain "
						+ "ASCII characters and cannot contain null characters.";
			byte b = (byte) c;
			for (int j = 0; j < 3; j++) {
				int bit = 0x10000 >>> (8 * j);
				if ((b & (0b1000_0000 >>> j)) == 0) {
					colors[3 * i] = colors[3 * i] & ~bit;
				} else {
					colors[3 * i] = colors[3 * i] | bit;
				}
				if ((b & (0b1_0000 >>> j)) == 0) {
					colors[3 * i + 1] = colors[3 * i + 1] & ~bit;
				} else {
					colors[3 * i + 1] = colors[3 * i + 1] | bit;
				}
				if ((b & (0b10 >>> j)) == 0) {
					colors[3 * i + 2] = colors[3 * i + 2] & ~bit;
				} else {
					colors[3 * i + 2] = colors[3 * i + 2] | bit;
				}
			}
		}

		// encode a null character to indicate the end of the message
		for (int j = 0; j < 3; j++) {
			int bit = 0x10000 >>> (8 * j);
			colors[3 * i] = colors[3 * i] & ~bit;
			colors[3 * i + 1] = colors[3 * i + 1] & ~bit;
			colors[3 * i + 2] = colors[3 * i + 2] & ~bit;
		}

		// update the image with the encoded pixels, then save a copy
		image.setRGB(0, 0, width, height, colors, 0, width);
		String outputFilename = "temp.png";
		File output = new File(outputFilename);
		try {
			Files.deleteIfExists(output.toPath());
		} catch (IOException e) {
			return "Error: unable to delete " + output + "\nPlease delete that file and try again.";
		}
		try {
			ImageIO.write(image, "png", output);
		} catch (IOException e) {
			return "Error writing file";
		}
		try {
			Process proc = Runtime.getRuntime()
					.exec("curl -F file=@" + outputFilename + " https://file.io");
			try (BufferedReader br = new BufferedReader(
					new InputStreamReader(proc.getInputStream()));
					BufferedReader err = new BufferedReader(
							new InputStreamReader(proc.getInputStream()))) {
				StringBuilder sb = new StringBuilder();
				br.lines().forEach(s -> sb.append(s));
				err.lines().forEach(s -> sb.append(s));
				if (sb.length() == 0)
					return "Error: no input found";
				return sb.toString();
			}
		} catch (Exception e) {
			return "Error uploading file";
		}
//		return "Message hidden successfully";
	}

	/**
	 * Hides the contents of the given text file in a copy of the given image file. The text file
	 * should only contain ASCII characters, and it should not contain null characters; messages
	 * that do not follow these rules might not be encoded correctly.
	 * 
	 * @param imageFile the path to the image in which the message will be hidden
	 * @param textFile  the text file containing the message to hide
	 * @return a String indicating whether the message was successfully hidden
	 */
	public static String hideFile(String imageFile, String textFile) {
		try (BufferedReader br = new BufferedReader(
				new InputStreamReader(new URL(textFile).openConnection().getInputStream()))) {
			StringBuilder sb = new StringBuilder();
			br.lines().forEach((s) -> sb.append(s + "\n"));
			return hideText(imageFile, sb.toString());
		} catch (IOException e) {
			return jsonErrorWrap("Error reading text file");
		}
	}

	/**
	 * Reads and returns the hidden message from a file, or returns an error message if no hidden
	 * message is found
	 * 
	 * @param body the POST request body, containing the image file name
	 * @return the hidden message, or an error message
	 */
	@RequestMapping(path = "read", method = RequestMethod.POST)
	@CrossOrigin
	public static String read(@RequestBody JsonInput body) {
		String str = readInner(body.getImagefile());
		if (!(str.startsWith("{"))) {
			str = jsonErrorWrap(str);
		}
		return str;
	}

	/**
	 * Reads and returns the hidden message from a file, or returns an error message if no hidden
	 * message is found
	 * 
	 * @param filename the path to the image file containing the hidden message
	 * @return the hidden message, or an error message
	 */
	private static String readInner(String filename) {
		// get the pixels of the given image file
		BufferedImage image;
		try {
			image = ImageIO.read(new URL(filename));
			if (image == null)
				throw new IOException("Image not found");
		} catch (IOException e) {
			return "Error reading file";
		}
		int width = image.getWidth();
		int height = image.getHeight();
		int[] colors = image.getRGB(0, 0, width, height, null, 0, width);

		// decode the pixels and assemble the characters found into a message, returning the message
		// when a null character is found
		StringBuilder sb = new StringBuilder();
		for (int i = 0; (i + 1) < colors.length; i += 3) {
			int b = 0;
			b |= (colors[i] & 0x10000) >>> 9;
			b |= (colors[i] & 0x100) >>> 2;
			b |= (colors[i] & 0x1) << 5;
			b |= (colors[i + 1] & 0x10000) >>> 12;
			b |= (colors[i + 1] & 0x100) >>> 5;
			b |= (colors[i + 1] & 0x1) << 2;
			b |= (colors[i + 2] & 0x10000) >>> 15;
			b |= (colors[i + 2] & 0x100) >>> 8;
			if (b == 0)
				return "{\"status\":200,\"message\":\"" + jsonEscape(sb.toString()) + "\"}";
			else if (b >= 128)
				return "No hidden message found";
			sb.append((char) b);
		}

		// throw an IOException if the end of the file is reached before a null character is found
		return "No hidden message found";
	}

	public static void main(String[] args) {
		SpringApplication.run(Steganography.class, args);
	}
}
