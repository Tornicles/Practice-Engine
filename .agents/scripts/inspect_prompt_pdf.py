from pathlib import Path
import fitz

pdf_path = Path("attached_assets/1k_prompts_1788517059592.pdf")
output_dir = Path(".agents/outputs/1k-prompts")
output_dir.mkdir(parents=True, exist_ok=True)

document = fitz.open(pdf_path)
sample_pages = sorted(set([0, 1, 2, 9, 24, 49, document.page_count - 1]))

for page_number in sample_pages:
    page = document[page_number]
    pixmap = page.get_pixmap(matrix=fitz.Matrix(1.5, 1.5), alpha=False)
    pixmap.save(output_dir / f"page-{page_number + 1:03d}.png")

with (output_dir / "extracted.txt").open("w", encoding="utf-8") as output:
    for page_number, page in enumerate(document):
        output.write(f"\n\n===== PAGE {page_number + 1} =====\n")
        output.write(page.get_text())

print(f"pages={document.page_count}")
print(f"rendered={','.join(str(page + 1) for page in sample_pages)}")