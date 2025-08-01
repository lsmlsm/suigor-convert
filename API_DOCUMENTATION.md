# PDF to JPG Conversion API Documentation

## Overview
This API converts PDF files to JPG images. Each page of the PDF is converted into a separate base64-encoded PNG image.

## Endpoint
```
POST https://suigor-convert-cb23e92afe90.herokuapp.com/api/convert-pdf-to-jpg
```

## Request

### Headers
- `Content-Type: multipart/form-data`

### Body
- **pdf** (required): The PDF file to convert
  - Type: File
  - Must be a valid PDF file (MIME type: `application/pdf`)
  - Maximum file size: Depends on server configuration (typically 50MB)

## Response

### Success Response
**Status Code:** 200 OK

```json
{
  "success": true,
  "images": [
    "data:image/png;base64,iVBORw0KGgoAAAANS...",
    "data:image/png;base64,iVBORw0KGgoAAAANS..."
  ],
  "pageCount": 2
}
```

**Fields:**
- `success`: Boolean indicating successful conversion
- `images`: Array of base64-encoded PNG images (one per PDF page)
- `pageCount`: Total number of pages/images converted

### Error Responses

**No File Provided**
- Status Code: 400 Bad Request
```json
{
  "error": "No PDF file provided"
}
```

**Invalid File Type**
- Status Code: 400 Bad Request
```json
{
  "error": "File must be a PDF"
}
```

**Processing Error**
- Status Code: 500 Internal Server Error
```json
{
  "error": "Failed to process PDF. Make sure the file is not corrupted."
}
```

## Example Usage

### JavaScript (Node.js)
```javascript
const fs = require('fs');
const FormData = require('form-data');
const axios = require('axios');

async function convertPdfToJpg(pdfPath) {
  const form = new FormData();
  form.append('pdf', fs.createReadStream(pdfPath));

  try {
    const response = await axios.post(
      'https://suigor-convert-cb23e92afe90.herokuapp.com/api/convert-pdf-to-jpg',
      form,
      {
        headers: form.getHeaders(),
        maxContentLength: Infinity,
        maxBodyLength: Infinity
      }
    );

    if (response.data.success) {
      console.log(`Converted ${response.data.pageCount} pages`);
      
      // Save images to files
      response.data.images.forEach((image, index) => {
        const base64Data = image.replace(/^data:image\/png;base64,/, '');
        fs.writeFileSync(`page-${index + 1}.png`, base64Data, 'base64');
      });
    }
  } catch (error) {
    console.error('Conversion failed:', error.response?.data || error.message);
  }
}

// Usage
convertPdfToJpg('./document.pdf');
```

### Python
```python
import requests
import base64
from pathlib import Path

def convert_pdf_to_jpg(pdf_path):
    url = 'https://suigor-convert-cb23e92afe90.herokuapp.com/api/convert-pdf-to-jpg'
    
    with open(pdf_path, 'rb') as f:
        files = {'pdf': ('document.pdf', f, 'application/pdf')}
        response = requests.post(url, files=files)
    
    if response.status_code == 200:
        data = response.json()
        if data['success']:
            print(f"Converted {data['pageCount']} pages")
            
            # Save images
            for i, image_data in enumerate(data['images']):
                # Remove data URL prefix
                image_data = image_data.split(',')[1]
                image_binary = base64.b64decode(image_data)
                
                with open(f'page-{i+1}.png', 'wb') as img_file:
                    img_file.write(image_binary)
    else:
        print(f"Error: {response.json()}")

# Usage
convert_pdf_to_jpg('document.pdf')
```

### cURL
```bash
curl -X POST https://suigor-convert-cb23e92afe90.herokuapp.com/api/convert-pdf-to-jpg \
  -F "pdf=@/path/to/document.pdf" \
  -o response.json
```

### JavaScript (Browser)
```javascript
async function convertPdfToJpg(file) {
  const formData = new FormData();
  formData.append('pdf', file);

  try {
    const response = await fetch('https://suigor-convert-cb23e92afe90.herokuapp.com/api/convert-pdf-to-jpg', {
      method: 'POST',
      body: formData
    });

    const data = await response.json();
    
    if (data.success) {
      console.log(`Converted ${data.pageCount} pages`);
      
      // Display or download images
      data.images.forEach((image, index) => {
        // Create download link
        const link = document.createElement('a');
        link.href = image;
        link.download = `page-${index + 1}.png`;
        link.click();
      });
    } else {
      console.error('Conversion failed:', data.error);
    }
  } catch (error) {
    console.error('Request failed:', error);
  }
}

// Usage with file input
document.getElementById('fileInput').addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (file && file.type === 'application/pdf') {
    convertPdfToJpg(file);
  }
});
```

### PHP
```php
<?php
$url = 'https://suigor-convert-cb23e92afe90.herokuapp.com/api/convert-pdf-to-jpg';
$pdfPath = '/path/to/document.pdf';

$ch = curl_init();
$cfile = new CURLFile($pdfPath, 'application/pdf', 'document.pdf');

curl_setopt($ch, CURLOPT_URL, $url);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, array('pdf' => $cfile));
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

if ($httpCode == 200) {
    $data = json_decode($response, true);
    
    if ($data['success']) {
        echo "Converted {$data['pageCount']} pages\n";
        
        // Save images
        foreach ($data['images'] as $index => $image) {
            $imageData = str_replace('data:image/png;base64,', '', $image);
            $imageData = base64_decode($imageData);
            file_put_contents("page-" . ($index + 1) . ".png", $imageData);
        }
    }
} else {
    echo "Error: " . $response;
}
?>
```

## Notes

1. **File Size Limits**: Large PDF files may take longer to process. The API has a 60-second timeout.

2. **Image Format**: All images are returned as PNG format in base64 encoding with data URL prefix.

3. **Image Quality**: Images are rendered at 2x scale for better quality.

4. **CORS**: If calling from a browser, ensure your domain is allowed by CORS policy.

5. **Rate Limiting**: Be mindful of rate limits if making multiple requests.

6. **Memory Usage**: Base64 encoding increases the data size by approximately 33%. For large PDFs with many pages, the response size can be significant.

## Troubleshooting

1. **405 Method Not Allowed**: Ensure you're using POST method, not GET.

2. **Timeout Errors**: For large PDFs, the conversion might exceed the timeout limit. Try with smaller files.

3. **Corrupted PDF Error**: Ensure the PDF file is valid and not password-protected.

4. **CORS Errors** (Browser): Contact the API provider to whitelist your domain.

## Support

For issues or questions about the API, please refer to the application documentation or contact the service provider.