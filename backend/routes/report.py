from fastapi import APIRouter, Response, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from datetime import datetime
import io

# Try to import reportlab for PDF generation, fallback to markdown
try:
    from reportlab.lib.pagesizes import letter
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Preformatted
    from reportlab.lib.units import inch
    REPORTLAB_AVAILABLE = True
    print("ReportLab available: True")
except ImportError as e:
    REPORTLAB_AVAILABLE = False
    print(f"ReportLab not available: {e}")

router = APIRouter()

class ReportRequest(BaseModel):
    language: str
    user_code: str
    execution_output: str | None = None
    execution_error: str | None = None
    ai_explanation: str
    learning_tip: str
    fixed_code: str | None = None
    gamified_questions: list[str] = []

    class Config:
        allow_none = True

@router.options("/report/download", include_in_schema=False)
async def report_options() -> Response:
    # Empty 204 response for CORS preflight; CORSMiddleware will add headers.
    return Response(status_code=204)

def generate_pdf_report(data: ReportRequest) -> bytes:
    """Generate a PDF report using reportlab."""
    try:
        buffer = io.BytesIO()

        # Create PDF document
        doc = SimpleDocTemplate(buffer, pagesize=letter)
        styles = getSampleStyleSheet()

        # Custom styles
        title_style = ParagraphStyle(
            'CustomTitle',
            parent=styles['Heading1'],
            fontSize=18,
            spaceAfter=30,
            alignment=1  # Center alignment
        )

        section_style = ParagraphStyle(
            'Section',
            parent=styles['Heading2'],
            fontSize=14,
            spaceAfter=12,
            textColor='#2D3748'
        )

        code_style = ParagraphStyle(
            'Code',
            parent=styles['Normal'],
            fontName='Courier',
            fontSize=10,
            leftIndent=20,
            spaceAfter=12
        )

        content_style = styles['Normal']

        # Build the PDF content
        story = []

        # Title
        story.append(Paragraph("CodeSnap Learning Report", title_style))
        story.append(Spacer(1, 0.25*inch))

        # Date & Time
        current_time = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        story.append(Paragraph(f"<b>Date & Time:</b> {current_time}", content_style))
        story.append(Spacer(1, 0.1*inch))

        # Language
        story.append(Paragraph(f"<b>Language:</b> {data.language.title()}", content_style))
        story.append(Spacer(1, 0.2*inch))

        # User Submitted Code
        story.append(Paragraph("User Submitted Code", section_style))
        story.append(Preformatted(data.user_code, code_style))
        story.append(Spacer(1, 0.15*inch))

        # Execution Result
        story.append(Paragraph("Execution Result", section_style))
        if data.execution_output:
            story.append(Paragraph(f"<b>Output:</b>", content_style))
            story.append(Preformatted(data.execution_output, code_style))
        if data.execution_error:
            story.append(Paragraph(f"<b>Error:</b>", content_style))
            story.append(Preformatted(data.execution_error, code_style))
        if not data.execution_output and not data.execution_error:
            story.append(Paragraph("Code executed successfully with no output or errors.", content_style))
        story.append(Spacer(1, 0.15*inch))

        # AI Explanation
        story.append(Paragraph("AI Explanation", section_style))
        story.append(Paragraph(data.ai_explanation, content_style))
        story.append(Spacer(1, 0.15*inch))

        # Learning Tip
        story.append(Paragraph("Learning Tip", section_style))
        story.append(Paragraph(data.learning_tip, content_style))
        story.append(Spacer(1, 0.15*inch))

        # Fixed Code (if exists)
        if data.fixed_code:
            story.append(Paragraph("Fixed Code", section_style))
            story.append(Preformatted(data.fixed_code, code_style))
            story.append(Spacer(1, 0.15*inch))

        # Practice Questions
        if data.gamified_questions:
            story.append(Paragraph("Practice Questions", section_style))
            for i, question in enumerate(data.gamified_questions, 1):
                story.append(Paragraph(f"{i}. {question}", content_style))
                story.append(Spacer(1, 0.1*inch))

        # Build PDF
        doc.build(story)
        buffer.seek(0)
        return buffer.getvalue()
    except Exception as e:
        print(f"Error generating PDF: {e}")
        raise

def generate_markdown_report(data: ReportRequest) -> str:
    """Generate a Markdown report as fallback."""
    current_time = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    markdown = f"""# CodeSnap Learning Report

**Date & Time:** {current_time}
**Language:** {data.language.title()}

## User Submitted Code
```python
{data.user_code}
```

## Execution Result
"""

    if data.execution_output:
        markdown += f"""**Output:**
```
{data.execution_output}
```
"""
    if data.execution_error:
        markdown += f"""**Error:**
```
{data.execution_error}
```
"""
    if not data.execution_output and not data.execution_error:
        markdown += "Code executed successfully with no output or errors.\n\n"

    markdown += f"""## AI Explanation
{data.ai_explanation}

## Learning Tip
{data.learning_tip}
"""

    if data.fixed_code:
        markdown += f"""## Fixed Code
```python
{data.fixed_code}
```
"""

    if data.gamified_questions:
        markdown += """## Practice Questions
"""
        for i, question in enumerate(data.gamified_questions, 1):
            markdown += f"{i}. {question}\n"

    return markdown

@router.post("/report/download")
async def download_report(data: ReportRequest):
    """
    Generate and download a learning report as PDF or Markdown.
    """
    try:
        # Generate timestamp for filename
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"codesnap_report_{timestamp}"

        if REPORTLAB_AVAILABLE:
            # Generate PDF report
            print("Generating PDF report...")
            pdf_content = generate_pdf_report(data)
            print(f"PDF generated, size: {len(pdf_content)} bytes")
            return StreamingResponse(
                io.BytesIO(pdf_content),
                media_type="application/pdf",
                headers={
                    "Content-Disposition": f"attachment; filename={filename}.pdf"
                }
            )
        else:
            # Fallback to Markdown
            print("Falling back to Markdown report...")
            markdown_content = generate_markdown_report(data)
            print(f"Markdown generated, length: {len(markdown_content)}")
            return StreamingResponse(
                io.BytesIO(markdown_content.encode('utf-8')),
                media_type="text/markdown",
                headers={
                    "Content-Disposition": f"attachment; filename={filename}.md"
                }
            )

    except Exception as e:
        print(f"Error generating report: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to generate report: {str(e)}")