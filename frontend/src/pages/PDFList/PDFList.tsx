import { useState, useRef, useEffect } from 'react';
import classNames from 'classnames/bind';
import styles from './PDFList.module.scss';
import { PDFItem } from './types';

const cx = classNames.bind(styles);

interface PDFListProps {
  activePdfId?: string | null;
  onView: (id: string, url: string, title: string) => void;
  setShowList: React.Dispatch<React.SetStateAction<boolean>>;
}

export default function PDFList({ activePdfId, onView, setShowList }: PDFListProps) {
  const [pdfList, setPdfList] = useState<PDFItem[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [editingPdfId, setEditingPdfId] = useState<string | null>(null);
  const [editingPdfName, setEditingPdfName] = useState<string>('');

  useEffect(() => {
    const fetchDocuments = async () => {
      try {
        const response = await fetch('http://localhost:8000/api/v1/document/list', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch documents');
        }

        const documents = await response.json();
        const formattedDocuments = documents.map((doc: any) => ({
          id: doc.id,
          title: doc.name,
          url: `http://localhost:8000/api/v1/document/${doc.id}`,
        }));
        setPdfList(formattedDocuments);
      } catch (error) {
        console.error('Error fetching documents:', error);
      }
    };

    fetchDocuments();
  }, []);

  const handleView = (id: string) => {
    if (activePdfId === id) {
      setShowList(false);
      return;
    }
    const pdf = pdfList.find(pdf => pdf.id === id);
    if (pdf) {
      onView(pdf.id, pdf.url, pdf.title);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch('http://localhost:8000/api/v1/document/delete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to delete document');
      }

      setPdfList(prev => prev.filter(pdf => pdf.id !== id));
    } catch (error) {
      console.error('Error deleting document:', error);
      alert(error instanceof Error ? error.message : 'Failed to delete PDF. Please try again.');
    }
  };

  const startEditing = (id: string, currentName: string) => {
    setEditingPdfId(id);
    setEditingPdfName(currentName);
  };

  const handleRenameSave = async (id: string) => {
    try {
      const response = await fetch('http://localhost:8000/api/v1/document/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, name: editingPdfName }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to update document');
      }

      setPdfList(prev =>
        prev.map(pdf => (pdf.id === id ? { ...pdf, title: editingPdfName } : pdf))
      );
      setEditingPdfId(null);
      setEditingPdfName('');
    } catch (error) {
      console.error('Error updating document:', error);
      alert(
        error instanceof Error ? error.message : 'Failed to update document. Please try again.'
      );
    }
  };

  const handleFileUpload = async (files: FileList | null) => {
    if (!files) return;

    const file = files[0];
    const formData = new FormData();
    formData.append('file', file);

    if (file && file.type === 'application/pdf') {
      try {
        const response = await fetch('http://localhost:8000/api/v1/document/upload', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.detail || 'Upload failed');
        }

        const data = await response.json();

        const newPdf: PDFItem = {
          id: data.id ? data.id.toString() : Date.now().toString(),
          title: file.name,
          url: data.id
            ? `http://localhost:8000/api/v1/document/${data.id}`
            : URL.createObjectURL(file),
        };
        setPdfList(prev => [...prev, newPdf]);
      } catch (error) {
        console.error('Error uploading file:', error);
        alert(error instanceof Error ? error.message : 'Failed to upload PDF. Please try again.');
      }
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className={cx('container')}>
      <div className={cx('header')}>
        <h1 className={cx('title')}>PDF 문서 목록</h1>
        <button className={cx('uploadButton')} onClick={handleUploadClick}>
          PDF 업로드
        </button>
        <input
          type="file"
          ref={fileInputRef}
          onChange={e => handleFileUpload(e.target.files)}
          accept=".pdf"
          style={{ display: 'none' }}
        />
      </div>
      <div className={cx('content')}>
        <ul className={cx('pdfList')}>
          {pdfList.map(pdf => (
            <li
              onClick={pdf.id === editingPdfId ? undefined : () => handleView(pdf.id)}
              key={pdf.id}
              className={cx('pdfItem', { active: activePdfId === pdf.id })}
            >
              {editingPdfId === pdf.id ? (
                <>
                  <input
                    type="text"
                    value={editingPdfName}
                    onChange={e => setEditingPdfName(e.target.value)}
                    onClick={e => e.stopPropagation()}
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        handleRenameSave(pdf.id);
                      }
                      if (e.key === 'Escape') {
                        setEditingPdfId(null);
                        setEditingPdfName('');
                      }
                    }}
                    className={cx('renameInput')}
                  />
                </>
              ) : (
                <span>{pdf.title}</span>
              )}
              <div className={cx('actions')}>
                {editingPdfId === pdf.id ? (
                  <>
                    <button
                      onClick={e => {
                        e.stopPropagation();
                        handleRenameSave(pdf.id);
                      }}
                    >
                      Save
                    </button>
                    <button
                      onClick={e => {
                        e.stopPropagation();
                        setEditingPdfId(null);
                        setEditingPdfName('');
                      }}
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={e => {
                        e.stopPropagation();
                        startEditing(pdf.id, pdf.title);
                      }}
                    >
                      Rename
                    </button>
                    <button
                      onClick={e => {
                        e.stopPropagation();
                        handleDelete(pdf.id);
                      }}
                    >
                      Delete
                    </button>
                  </>
                )}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
