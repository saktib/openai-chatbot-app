require('dotenv').config();
const pdfParse = require('pdf-parse');
const ExcelJS = require('exceljs');
const axios = require('axios');
const express = require('express');
const app = express();
const cors = require('cors');
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });
// OpenAI API setup
const OPENAI_ORG_ID = '';
const OPENAI_API_KEY = '';
const PORT = 3001;

// Enable All CORS Requests for development
app.use(cors());

// Middleware to parse JSON bodies
app.use(express.json());

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Function to get embeddings from OpenAI
async function getEmbeddings(text) {
  try {

	 const response = await axios.post('https://api.openai.com/v1/embeddings', {
      model: "text-embedding-ada-002",
      input: text
    }, {
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
		'Openai-Organization': `${OPENAI_ORG_ID}`,
        'Content-Type': 'application/json'
      }
    });

    return response.data.data[0].embedding;
	
	
	
  } catch (error) {
    console.error('Error in OpenAI API:', error);
    return null;
  }
}

// Function to save data to Excel
async function saveToExcel(data) {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Embeddings');

  // Define columns
  sheet.columns = [
    { header: 'Text', key: 'text', width: 30 },
    { header: 'Embedding', key: 'embedding', width: 50 }
  ];

  // Add rows
  data.forEach(d => {
    sheet.addRow({ text: d.text, embedding: d.embedding });
  });

  // Save the file
  await workbook.xlsx.writeFile('Embeddings.xlsx');
}

app.post('/upload', upload.array('files'), async (req, res) => {
  try {
    const embeddings = [];

    for (const file of req.files) {
      const data = await pdfParse(file.buffer);
      const embedding = await getEmbeddings(data.text);

      embeddings.push({ text: data.text, embedding });
    }

    await saveToExcel(embeddings);

    res.send({ message: 'Files processed and embeddings saved.' });
  } catch (error) {
    console.error(error);
    res.status(500).send({ message: 'Error processing files' });
  }
});


// Function to interact with OpenAI's chat API
async function getChatResponse(context, message) {
  try {	
	const prompt = `${context}\n\nUser: ${message}\nAI:`;
	const url = 'https://api.openai.com/v1/engines/text-davinci-003/completions';
    const response = await axios.post(url, {
      prompt: prompt,
      max_tokens: 120
    }, {
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
		'Openai-Organization': `${OPENAI_ORG_ID}`,
		'Content-Type': 'application/json'
      }
    });
console.log("response from GPT", response);
    return response.data.choices[0].text.trim();
	

   // return response.data.choices[0].message.content;
  } catch (error) {
    console.error('Error in OpenAI API:', error);
    return null;
  }
}

// Function to read data from Excel
async function readFromExcel(context) {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile('Embeddings.xlsx');
  const worksheet = workbook.getWorksheet('Embeddings');

	let contextText = "";
    worksheet.eachRow((row) => {
    const text = row.getCell(1).value; // Assuming column 1 has text
    if (text && text.includes(context)) {
      contextText = text;
      return;
    }
  });

  return contextText;
  
}

app.post('/chat', async (req, res) => {
  const { context, message } = req.body;

  try {
    const contextText = await readFromExcel(context);
	if (!contextText) {
		return "I'm sorry, I couldn't find relevant information.";
	  }
  
    const aiResponse = await getChatResponse(contextText, message);

	console.log("aiResponse:", aiResponse);
	
    res.send({ reply: aiResponse });
  } catch (error) {
    console.error(error);
    res.status(500).send({ message: 'Error processing chat request' });
  }
});
