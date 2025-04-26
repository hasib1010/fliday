'use client';
// src\components\editor\EditorComponent.jsx
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import TiptapImage from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import CharacterCount from '@tiptap/extension-character-count';
import Youtube from '@tiptap/extension-youtube';
import { useEffect, useState } from 'react';

export default function EditorComponent({ content, onUpdate, index }) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const editor = useEditor({
        extensions: [
            StarterKit.configure({
                heading: {
                    levels: [1, 2, 3],
                },
            }),
            Underline,
            TextAlign.configure({
                types: ['heading', 'paragraph'],
            }),
            Link.configure({
                openOnClick: false,
            }),
            TiptapImage.configure({
                inline: true,
                HTMLAttributes: {
                    class: 'prose-img',
                },
            }),
            Youtube.configure({
                controls: true,
                HTMLAttributes: {
                    class: 'prose-video',
                },
            }),
            Placeholder.configure({
                placeholder: 'Write your content here...',
            }),
            CharacterCount.configure({
                limit: 50000,
            }),
        ],
        content: content,
        editorProps: {
            attributes: {
                class: 'prose prose-sm max-w-none focus:outline-none min-h-[300px] p-4',
            },
        },
        onUpdate: ({ editor }) => {
            const html = editor.getHTML();
            onUpdate(html);
        },
    });

    // Register the editor instance with the parent component
    useEffect(() => {
        if (editor && typeof index === 'number' && typeof window !== 'undefined') {
            // Store the editor reference in the window object for parent access
            window.editorRegistry = window.editorRegistry || {};
            window.editorRegistry[index] = editor;
        }
        
        return () => {
            if (typeof window !== 'undefined' && window.editorRegistry && typeof index === 'number') {
                delete window.editorRegistry[index];
            }
        };
    }, [editor, index]);

    if (!mounted) {
        return (
            <div className="min-h-[300px] border border-gray-300 rounded-md p-6 bg-white prose prose-sm max-w-none">
                Loading editor...
            </div>
        );
    }

    if (!editor) {
        return null;
    }

    return (
        <div className="border-t border-gray-200 editor-container">
            <EditorContent editor={editor} className="prose-wrapper" />
            <style jsx global>{`
                .ProseMirror {
                    min-height: 300px;
                    padding: 1rem;
                    outline: none !important;
                }
                
                .ProseMirror p {
                    margin: 1em 0;
                }
                
                .ProseMirror h1 {
                    font-size: 1.5rem;
                    font-weight: bold;
                    margin: 1em 0 0.5em;
                }
                
                .ProseMirror h2 {
                    font-size: 1.25rem;
                    font-weight: bold;
                    margin: 1em 0 0.5em;
                }
                
                .ProseMirror h3 {
                    font-size: 1.125rem;
                    font-weight: bold;
                    margin: 1em 0 0.5em;
                }
                
                .ProseMirror ul,
                .ProseMirror ol {
                    padding-left: 1.5em;
                    margin: 1em 0;
                }
                
                .ProseMirror li {
                    margin: 0.5em 0;
                }
                
                .ProseMirror img {
                    max-width: 100%;
                    height: auto;
                    display: block;
                    margin: 1em 0;
                }
                
                .ProseMirror blockquote {
                    border-left: 3px solid #ddd;
                    margin-left: 0;
                    margin-right: 0;
                    padding-left: 1em;
                    font-style: italic;
                }
                
                .ProseMirror pre {
                    background-color: #f5f5f5;
                    padding: 0.75em;
                    border-radius: 0.25em;
                    overflow-x: auto;
                }
                
                .ProseMirror code {
                    background-color: #f5f5f5;
                    padding: 0.2em 0.4em;
                    border-radius: 0.25em;
                    font-family: monospace;
                }
                
                .ProseMirror a {
                    color: #F15A25;
                    text-decoration: underline;
                }
            `}</style>
        </div>
    );
}