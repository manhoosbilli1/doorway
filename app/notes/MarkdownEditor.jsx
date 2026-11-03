'use client';
import React,{useRef,useEffect} from 'react';
import {useEditor,EditorContent} from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import {Markdown} from '@tiptap/markdown';
import {Bold,Italic,List,ListOrdered,Heading2,Quote,Code,Undo2,Redo2} from 'lucide-react';
export default function MarkdownEditor({id,value,onChange}){
 const latest=useRef(onChange);latest.current=onChange;const editor=useEditor({extensions:[StarterKit.configure({link:{openOnClick:false}}),Markdown],content:value||'',contentType:'markdown',immediatelyRender:false,onUpdate:({editor})=>latest.current(editor.getMarkdown()),editorProps:{attributes:{class:'markdown-content','aria-label':'Note text',role:'textbox','aria-multiline':'true'}}},[id]);
 useEffect(()=>{if(editor&&!editor.isFocused&&editor.getMarkdown()!==(value||''))editor.commands.setContent(value||'',{contentType:'markdown',emitUpdate:false})},[editor,id]);
 if(!editor)return <div className="markdown-loading">Opening note…</div>;
 const tools=[[Bold,'Bold',()=>editor.chain().focus().toggleBold().run(),'bold'],[Italic,'Italic',()=>editor.chain().focus().toggleItalic().run(),'italic'],[Heading2,'Heading',()=>editor.chain().focus().toggleHeading({level:2}).run(),'heading'],[List,'Bulleted list',()=>editor.chain().focus().toggleBulletList().run(),'bulletList'],[ListOrdered,'Numbered list',()=>editor.chain().focus().toggleOrderedList().run(),'orderedList'],[Quote,'Quote',()=>editor.chain().focus().toggleBlockquote().run(),'blockquote'],[Code,'Code',()=>editor.chain().focus().toggleCode().run(),'code'],[Undo2,'Undo',()=>editor.chain().focus().undo().run(),null],[Redo2,'Redo',()=>editor.chain().focus().redo().run(),null]];
 return <div className="markdown-editor"><div className="markdown-toolbar" role="toolbar" aria-label="Format note">{tools.map(([Icon,label,run,mark])=><button key={label} title={label} aria-label={label} aria-pressed={mark?editor.isActive(mark):undefined} onMouseDown={e=>e.preventDefault()} onClick={run}><Icon size={15}/></button>)}</div><EditorContent editor={editor}/></div>
}
