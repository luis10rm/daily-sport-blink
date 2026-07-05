import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Underline from "@tiptap/extension-underline";
import Youtube from "@tiptap/extension-youtube";
import { Button } from "@/components/ui/button";
import { Toggle } from "@/components/ui/toggle";
import { Separator } from "@/components/ui/separator";
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Link as LinkIcon,
  Unlink,
  Youtube as YoutubeIcon,
  Code as CodeIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useEffect, useCallback, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { looksLikeEncodedHtml, unescapeHtmlIfEncoded } from "@/lib/unescapeHtmlIfEncoded";

const looksLikeHtml = (s: string) => /<\/?[a-z][\s\S]*>/i.test(s);

interface RichTextEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
}

export const RichTextEditor = ({
  content,
  onChange,
  placeholder = "Napisz treść artykułu...",
}: RichTextEditorProps) => {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [2, 3],
        },
      }),
      Underline,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: "text-primary underline",
        },
      }),
      Youtube.configure({
        controls: true,
        nocookie: true,
        modestBranding: true,
        HTMLAttributes: {
          class: "w-full aspect-video rounded-md my-4",
        },
      }),
    ],
    content: content || "",
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class:
          "min-h-[250px] w-full rounded-md border-none bg-transparent px-3 py-2 text-sm focus:outline-none prose prose-sm dark:prose-invert max-w-none",
      },
      handlePaste: (view, event) => {
        const cd = event.clipboardData;
        if (!cd) return false;
        const text = cd.getData("text/plain");
        if (!text) return false;

        // Case 1: clipboard contains ENCODED HTML entities (e.g. `&lt;p&gt;&lt;strong&gt;...`)
        // — happens when copying from view-source, code blocks, ChatGPT canvas, docs.
        if (looksLikeEncodedHtml(text)) {
          event.preventDefault();
          const decoded = unescapeHtmlIfEncoded(text);
          editor?.commands.insertContent(decoded, {
            parseOptions: { preserveWhitespace: false },
          });
          return true;
        }

        // Case 2: clipboard contains raw HTML markup — parse it as HTML rather than
        // letting the browser hand us text/html that may be an escaped rendering.
        if (looksLikeHtml(text)) {
          event.preventDefault();
          editor?.commands.insertContent(text, {
            parseOptions: { preserveWhitespace: false },
          });
          return true;
        }
        return false; // fall back to TipTap's native handling
      },
    },
  });

  const [htmlDialogOpen, setHtmlDialogOpen] = useState(false);
  const [htmlDraft, setHtmlDraft] = useState("");

  // Sync external content changes
  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content || "");
    }
  }, [content, editor]);

  const setLink = useCallback(() => {
    if (!editor) return;

    const previousUrl = editor.getAttributes("link").href;
    const url = window.prompt("URL linku:", previousUrl);

    if (url === null) return;

    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }

    editor
      .chain()
      .focus()
      .extendMarkRange("link")
      .setLink({ href: url })
      .run();
  }, [editor]);

  const addYoutube = useCallback(() => {
    if (!editor) return;
    const url = window.prompt("Wklej link do YouTube (np. https://www.youtube.com/watch?v=…):");
    if (!url) return;
    editor.chain().focus().setYoutubeVideo({ src: url }).run();
  }, [editor]);

  if (!editor) {
    return null;
  }

  return (
    <div className="rounded-md border border-input bg-background">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-1 border-b border-input p-2">
        {/* Text formatting */}
        <Toggle
          size="sm"
          pressed={editor.isActive("bold")}
          onPressedChange={() => editor.chain().focus().toggleBold().run()}
          aria-label="Pogrubienie"
        >
          <Bold className="h-4 w-4" />
        </Toggle>
        <Toggle
          size="sm"
          pressed={editor.isActive("italic")}
          onPressedChange={() => editor.chain().focus().toggleItalic().run()}
          aria-label="Kursywa"
        >
          <Italic className="h-4 w-4" />
        </Toggle>
        <Toggle
          size="sm"
          pressed={editor.isActive("underline")}
          onPressedChange={() => editor.chain().focus().toggleUnderline().run()}
          aria-label="Podkreślenie"
        >
          <UnderlineIcon className="h-4 w-4" />
        </Toggle>
        <Toggle
          size="sm"
          pressed={editor.isActive("strike")}
          onPressedChange={() => editor.chain().focus().toggleStrike().run()}
          aria-label="Przekreślenie"
        >
          <Strikethrough className="h-4 w-4" />
        </Toggle>

        <Separator orientation="vertical" className="mx-1 h-6" />

        {/* Headings */}
        <Toggle
          size="sm"
          pressed={editor.isActive("heading", { level: 2 })}
          onPressedChange={() =>
            editor.chain().focus().toggleHeading({ level: 2 }).run()
          }
          aria-label="Nagłówek H2"
        >
          <Heading2 className="h-4 w-4" />
        </Toggle>
        <Toggle
          size="sm"
          pressed={editor.isActive("heading", { level: 3 })}
          onPressedChange={() =>
            editor.chain().focus().toggleHeading({ level: 3 }).run()
          }
          aria-label="Nagłówek H3"
        >
          <Heading3 className="h-4 w-4" />
        </Toggle>

        <Separator orientation="vertical" className="mx-1 h-6" />

        {/* Lists */}
        <Toggle
          size="sm"
          pressed={editor.isActive("bulletList")}
          onPressedChange={() =>
            editor.chain().focus().toggleBulletList().run()
          }
          aria-label="Lista punktowana"
        >
          <List className="h-4 w-4" />
        </Toggle>
        <Toggle
          size="sm"
          pressed={editor.isActive("orderedList")}
          onPressedChange={() =>
            editor.chain().focus().toggleOrderedList().run()
          }
          aria-label="Lista numerowana"
        >
          <ListOrdered className="h-4 w-4" />
        </Toggle>

        <Separator orientation="vertical" className="mx-1 h-6" />

        {/* Blockquote */}
        <Toggle
          size="sm"
          pressed={editor.isActive("blockquote")}
          onPressedChange={() =>
            editor.chain().focus().toggleBlockquote().run()
          }
          aria-label="Cytat"
        >
          <Quote className="h-4 w-4" />
        </Toggle>

        {/* Link */}
        <Toggle
          size="sm"
          pressed={editor.isActive("link")}
          onPressedChange={setLink}
          aria-label="Dodaj link"
        >
          <LinkIcon className="h-4 w-4" />
        </Toggle>
        {editor.isActive("link") && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().unsetLink().run()}
            className="h-8 px-2"
          >
            <Unlink className="h-4 w-4" />
          </Button>
        )}

        <Separator orientation="vertical" className="mx-1 h-6" />

        {/* YouTube embed */}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={addYoutube}
          className="h-8 px-2"
          aria-label="Osadź film z YouTube"
          title="Osadź film z YouTube"
        >
          <YoutubeIcon className="h-4 w-4" />
        </Button>

        {/* Paste HTML */}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => {
            setHtmlDraft("");
            setHtmlDialogOpen(true);
          }}
          className="h-8 px-2"
          aria-label="Wklej HTML"
          title="Wklej HTML"
        >
          <CodeIcon className="h-4 w-4" />
        </Button>
      </div>

      {/* Editor content */}
      <EditorContent editor={editor} />

      <Dialog open={htmlDialogOpen} onOpenChange={setHtmlDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Wklej HTML</DialogTitle>
            <DialogDescription>
              Wklej surowy HTML — zostanie sparsowany i wstawiony w miejscu kursora.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            value={htmlDraft}
            onChange={(e) => setHtmlDraft(e.target.value)}
            placeholder="<h2>Nagłówek</h2><p>Treść…</p>"
            className="min-h-[240px] font-mono text-xs"
          />
          <DialogFooter>
            <Button variant="ghost" onClick={() => setHtmlDialogOpen(false)}>
              Anuluj
            </Button>
            <Button
              onClick={() => {
                const raw = htmlDraft.trim();
                if (!raw) return;
                const html = unescapeHtmlIfEncoded(raw);
                editor
                  .chain()
                  .focus()
                  .insertContent(html, { parseOptions: { preserveWhitespace: false } })
                  .run();
                setHtmlDialogOpen(false);
              }}
            >
              Wstaw
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
