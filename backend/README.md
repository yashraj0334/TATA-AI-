# Tata Legal AI - Backend

Backend service for the Tata Legal AI contract analysis system.

The backend accepts PDF contracts, extracts their text, identifies clauses, retrieves relevant legal knowledge using RAG and ChromaDB, and uses Google Gemini to analyze each clause for risk.

The backend also supports human-in-the-loop review and document result persistence and retrieval using SQLite.

---

## 1. Backend Workflow

PDF Upload
    ↓
File Validation
    ↓
OCR / Text Extraction
    ↓
Clause Parsing
    ↓
RAG Retrieval
    ↓
ChromaDB + Sentence Transformers
    ↓
Google Gemini Analysis
    ↓
Clause Risk Analysis
    ↓
Human Review
    ↓
Result Persistence
    ↓
JSON API Response


---

## 2. Main Features

- PDF contract upload
- PDF text extraction using OCR
- Contract clause parsing
- Legal knowledge retrieval using RAG
- ChromaDB vector database
- Sentence Transformers embeddings
- Google Gemini-based clause analysis
- Structured JSON AI output
- Risk classification
- Risk explanation
- Recommendations
- Retrieved source references
- Human-in-the-loop approval workflow
- Clause accept, reject, edit, and escalate actions
- Document result persistence using SQLite
- Unique document ID generation
- Document result retrieval using document ID
- API health check
- Swagger API documentation
- Input validation and API error handling


---

## 3. Project Structure

backend/
│
├── api/
│   ├── upload.py
│   └── human_approval.py
│
├── services/
│   ├── ocr_service.py
│   ├── parser_service.py
│   ├── rag_service.py
│   ├── ai_service.py
│   ├── approval_service.py
│   └── document_service.py
│
├── models/
│
├── rag/
│
├── chroma_db/
├── data/
│   └── approvals.db
│
├── main.py
├── requirements.txt
├── requirements-full.txt
└── README.md


---

## 4. Backend Services

### ocr_service.py

Responsible for extracting text from uploaded PDF documents using OCR.

### parser_service.py

Identifies and structures individual clauses from the extracted document text.

### rag_service.py

Retrieves relevant legal knowledge from the ChromaDB vector database for each clause.

The service uses Sentence Transformers embeddings and retrieves relevant knowledge that is passed as context to the AI analysis stage.

### ai_service.py

Uses Google Gemini to analyze each legal clause together with the retrieved legal context.

The AI analysis provides:

- Clause name
- Summary
- Risk level
- Risk reason
- Recommendation

The response is requested in structured JSON format.

### approval_service.py

Handles the human-in-the-loop review workflow.

A reviewer can:

- View a clause review
- Accept a clause
- Reject a clause
- Edit a clause
- Escalate a clause

The review information can include:

- Reviewer
- Review status
- Comment
- Edited text where applicable

### document_service.py

Responsible for document result persistence and retrieval.

After successful document processing, the service stores the result in SQLite.

Stored information includes:

- Document ID
- Filename
- Complete processing result
- Creation time

The service also retrieves previously processed documents using their unique document ID.

### api/upload.py

Acts as the main integration point for the backend processing workflow.

The endpoint connects:

PDF → OCR → Clause Parsing → RAG Retrieval → Gemini Analysis → Human Review → Result Persistence → JSON Response

It also generates a unique document ID for each successfully processed document.

### main.py

Creates the FastAPI application and connects the API routers.


---

## 5. Backend Integration

The backend is designed as a modular end-to-end processing pipeline.

The main upload API coordinates the different services.

When a PDF is uploaded:

1. The file is validated.
2. Text is extracted from the PDF.
3. The extracted text is parsed into clauses.
4. Relevant legal knowledge is retrieved using RAG.
5. The retrieved context and clause are sent to Google Gemini.
6. The AI generates structured clause-level analysis.
7. Human review information is included in the result.
8. The complete result is saved to SQLite.
9. A unique document ID is returned to the client.

This integration allows the frontend to interact with the backend through a single document-processing workflow.


---

## 6. RAG Configuration

### Embedding Model

sentence-transformers/all-MiniLM-L6-v2

### Embedding Dimension

384

### Vector Database

ChromaDB

The backend uses a local ChromaDB vector store for retrieving relevant legal knowledge.

The RAG service retrieves relevant information for each clause and provides it as context to the AI analysis stage.

The knowledge base should remain coordinated with the project team's agreed legal reference material.


---

## 7. LLM Configuration

The backend uses Google Gemini for clause analysis.

### Python Package

google-genai

### Environment Variable

GEMINI_API_KEY

### Model

gemini-3.5-flash-lite

The Gemini API is used to analyze legal clauses together with the context retrieved from the RAG pipeline.

The AI response is requested as structured JSON using:

response_mime_type = "application/json"

The API key must be stored in the backend `.env` file and must never be committed to GitHub.


---

## 8. Document Persistence

The backend stores successfully processed document results in a SQLite database.

Database location:

backend/data/approvals.db

The `documents` table stores:

| Field | Description |
|---|---|
| id | Internal database ID |
| document_id | Unique document identifier |
| filename | Uploaded PDF filename |
| result | Complete processing result stored as JSON |
| created_at | Document processing timestamp |

Each processed document receives a unique document ID, for example:

DOC-9C085A8A7B7B

This ID can be used to retrieve the previously saved document result.


---

## 9. API Endpoints

### Health APIs

#### GET /

Returns a basic backend status message.

#### GET /health

Returns the health status of the backend service.

Example:

{
    "status": "ok",
    "service": "Tata Legal AI Backend"
}


### Document Processing

#### POST /upload

Uploads and processes a PDF contract.

The backend:

1. Validates the PDF
2. Extracts text
3. Parses clauses
4. Retrieves relevant legal knowledge
5. Performs Gemini analysis
6. Adds human review information
7. Saves the result to SQLite
8. Returns a unique document ID and structured analysis


### Document Retrieval

#### GET /documents/{document_id}

Retrieves a previously processed document using its unique document ID.

Example:

GET /documents/DOC-9C085A8A7B7B

The API returns:

- Document ID
- Filename
- Complete saved analysis result
- Creation time


### Human Approval APIs

#### GET /approvals/pending

Returns clauses that require review.

#### GET /approvals/{clause_id}

Returns the review information for a specific clause.

#### POST /approvals/{clause_id}/accept

Accepts a clause during human review.

#### POST /approvals/{clause_id}/reject

Rejects a clause during human review.

#### PUT /approvals/{clause_id}/edit

Allows a reviewer to edit clause information.

#### POST /approvals/{clause_id}/escalate

Escalates a clause for further review.


---

## 10. Analysis Response

Each analyzed clause contains information such as:

- Clause number
- Clause name
- Clause text
- Clause ID
- Analysis
- Sources
- Human review information

The analysis contains:

- Clause name
- Summary
- Risk level
- Risk reason
- Recommendation

Sources contain:

- Source
- Page


---

## 11. Human-in-the-Loop Workflow

The system does not rely only on automated AI analysis.

After AI analysis, clauses can be reviewed by a human reviewer.

The reviewer can:

1. Review the AI-generated analysis.
2. Accept the clause.
3. Reject the clause.
4. Edit the clause information.
5. Escalate the clause when additional review is required.

This provides human oversight and allows the AI system to support legal decision-making rather than automatically making the final legal decision.


---

## 12. Error Handling

The API validates uploaded files and handles common processing failures.

### Non-PDF file

HTTP 400

{
    "detail": "Only PDF files are supported."
}

### Empty PDF

HTTP 400

{
    "detail": "The uploaded PDF is empty."
}

### Unable to extract text

HTTP 422

{
    "detail": "Could not extract text from the PDF."
}

### No clauses detected

HTTP 422

{
    "detail": "No clauses could be identified in the document."
}

### Document not found

HTTP 404

{
    "detail": "Document not found."
}

### Unexpected processing error

HTTP 500


---

## 13. Environment Variables

Create a `.env` file inside the backend directory.

Example:

GEMINI_API_KEY=your_gemini_api_key

The `.env` file must remain private.

Do not commit API keys or other secrets to GitHub.


---

## 14. Installation

Create and activate a virtual environment.

### Windows PowerShell

python -m venv venv

.\venv\Scripts\Activate.ps1

Install the dependencies:

pip install -r requirements.txt


---

## 15. Run the Backend

From the backend directory:

python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000

The backend will normally run at:

http://localhost:8000


---

## 16. Swagger API Documentation

FastAPI automatically provides interactive Swagger API documentation.

Open:

http://localhost:8000/docs

Swagger can be used to test:

- Health APIs
- PDF upload
- Document retrieval
- Human approval APIs

The document persistence workflow can be tested by:

1. Uploading a PDF using POST `/upload`.
2. Copying the returned `document_id`.
3. Calling GET `/documents/{document_id}`.
4. Verifying that the saved result is returned.


---

## 17. Frontend Integration

The frontend communicates with the backend through the FastAPI endpoints.

The main upload workflow is:

Frontend
    ↓
POST /upload
    ↓
Backend Processing Pipeline
    ↓
OCR
    ↓
Clause Parsing
    ↓
RAG Retrieval
    ↓
Gemini Analysis
    ↓
Human Review Data
    ↓
SQLite Persistence
    ↓
JSON Response
    ↓
Frontend


The frontend can display:

- Contract clauses
- Risk level
- Summary
- Risk reason
- Recommendations
- Source references
- Human review status


---

## 18. Testing

The backend APIs have been tested using FastAPI Swagger.

The document persistence workflow was verified by:

1. Uploading a test PDF.
2. Successfully processing the document.
3. Generating a unique document ID.
4. Saving the result to SQLite.
5. Retrieving the result using GET `/documents/{document_id}`.

Example document ID:

DOC-9C085A8A7B7B

The retrieval response includes the saved document information, analysis result, and creation timestamp.


---

## 19. Important Knowledge Base Note

The knowledge base used during development may contain synthetic demonstration/reference material.

It must not be represented as actual confidential Tata material or as an actual Tata-approved legal position.

The final knowledge base and vector database should remain aligned with the project team's agreed reference material.


---

## 20. Security Notes

- API keys are stored in environment variables.
- `.env` files must not be committed to GitHub.
- No API key or secret should be exposed in source code.
- Generated/local databases should be reviewed before committing.
- The application should use appropriate access controls when deployed.


---

## 21. Development Status

Current backend implementation:

- PDF upload: Complete
- File validation: Complete
- OCR/text extraction: Complete
- Clause parsing: Complete
- RAG retrieval: Complete
- ChromaDB integration: Complete
- Gemini LLM integration: Complete
- Structured JSON AI output: Complete
- Human approval workflow: Complete
- API error handling: Complete
- Health check: Complete
- Swagger testing: Complete
- Document persistence: Complete
- Document retrieval: Complete
- Unique document ID generation: Complete


---

## 22. Team Integration

The backend provides structured APIs that allow the frontend to consume the document analysis workflow.

The backend integration connects document processing, retrieval, AI analysis, human review, and result persistence into a single workflow.

The system is designed so that the frontend can upload a document, receive structured clause-level analysis, display the results, and retrieve previously processed documents using their document ID.


---

## 23. Disclaimer

This project is an AI-powered legal document analysis prototype intended for demonstration and educational purposes.

The generated analysis should not be considered legal advice or a substitute for professional legal review.
