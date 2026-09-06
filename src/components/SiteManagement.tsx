import React, { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { doc, getDoc, setDoc, collection, getDocs, addDoc, deleteDoc, updateDoc, query, orderBy } from 'firebase/firestore';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Save, Plus, Trash2, Home, Globe, BookOpen, 
  Briefcase, Camera, Eye, EyeOff, Share2, 
  Settings as SettingsIcon, Type, ChevronRight, Edit3, X, Mail
} from 'lucide-react';

export const SiteManagement: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error', msg: string } | null>(null);
  const [activeTab, setActiveTab] = useState<'hero' | 'visibility' | 'contact' | 'social' | 'headings' | 'content' | 'global'>('hero');
  const [editingItem, setEditingItem] = useState<{ col: string, item: any } | null>(null);
  const [blogEditorTab, setBlogEditorTab] = useState<'write' | 'preview'>('write');
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  
  // States for GST Slab Management
  const [newSlabRate, setNewSlabRate] = useState<string>('');
  const [newSlabLabel, setNewSlabLabel] = useState<string>('');

  // Multi-purpose Site Data
  const [siteSettings, setSiteSettings] = useState<any>({
    heroTitle: '',
    heroName: '',
    heroDesc: '',
    heroImage: '',
    siteLogo: '',
    heroSkills: [],
    contactEmail: '',
    contactPhone: '',
    contactWhatsapp: '',
    contactHours: '',
    contactImage: '',
    contactTitle: '',
    contactJob: '',
    contactDesc: '',
    gstSlabs: [
      { rate: 5, label: '5% SGST + CGST' },
      { rate: 12, label: '12% Med Supplies' },
      { rate: 18, label: '18% Luxury Clinical' }
    ],
    visibility: {
      features: true,
      aiChat: true,
      courses: true,
      portfolio: true,
      resume: true,
      testimonial: true,
      clients: true,
      blog: true,
      newsLaunchpad: true,
      bestSkills: true,
      spectatorArena: true,
      verifiedRoster: true
    },
    socials: {
      facebook: '',
      twitter: '',
      linkedin: '',
      github: '',
      instagram: ''
    },
    headings: {
      features: { title: 'What I Do', subtitle: 'Features' },
      courses: { title: 'Educational Programs', subtitle: 'My Courses' },
      portfolio: { title: 'My Portfolio', subtitle: 'Latest Projects' },
      newsLaunchpad: { title: 'Start Your News Agency', subtitle: 'News Business Launchpad' },
      resume: { title: 'Professional Path', subtitle: 'Experience' },
      testimonial: { title: 'Client Feedback', subtitle: 'Testimonials' },
      blog: { title: 'Latest Stories', subtitle: 'My Blog' },
      clients: { title: 'Trusted By', subtitle: 'Partners' }
    },
    footerRights: '© 2026. All rights reserved.',
    portfolioStyle: 'grid'
  });

  const [services, setServices] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [blogs, setBlogs] = useState<any[]>([]);
  const [experience, setExperience] = useState<any[]>([]);
  const [education, setEducation] = useState<any[]>([]);
  const [testimonials, setTestimonials] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const settingsSnap = await getDoc(doc(db, 'site', 'settings'));
      if (settingsSnap.exists()) {
        const data = settingsSnap.data();
        const loadedSlabs = data.gstSlabs || [
          { rate: 5, label: '5% SGST + CGST' },
          { rate: 12, label: '12% Med Supplies' },
          { rate: 18, label: '18% Luxury Clinical' }
        ];
        setSiteSettings((prev: any) => ({
          ...prev,
          ...data,
          visibility: { ...prev.visibility, ...(data.visibility || {}) },
          socials: { ...prev.socials, ...(data.socials || {}) },
          headings: { ...prev.headings, ...(data.headings || {}) },
          gstSlabs: loadedSlabs
        }));
        localStorage.setItem('gst_slabs', JSON.stringify(loadedSlabs));
      } else {
        localStorage.setItem('gst_slabs', JSON.stringify([
          { rate: 5, label: '5% SGST + CGST' },
          { rate: 12, label: '12% Med Supplies' },
          { rate: 18, label: '18% Luxury Clinical' }
        ]));
      }

      const [srvSnap, crsSnap, prjSnap, blgSnap, expSnap, eduSnap, tstSnap, cltSnap] = await Promise.all([
        getDocs(collection(db, 'services')),
        getDocs(collection(db, 'courses')),
        getDocs(collection(db, 'projects')),
        getDocs(query(collection(db, 'blogs'), orderBy('createdAt', 'desc'))),
        getDocs(collection(db, 'experience')),
        getDocs(collection(db, 'education')),
        getDocs(collection(db, 'testimonials')),
        getDocs(collection(db, 'clients'))
      ]);

      setServices(srvSnap.docs.map(d => ({ id: d.id, ...d.data() as any })));
      setCourses(crsSnap.docs.map(d => ({ id: d.id, ...d.data() as any })));
      setProjects(prjSnap.docs.map(d => ({ id: d.id, ...d.data() as any })));
      setBlogs(blgSnap.docs.map(d => ({ id: d.id, ...d.data() as any })));
      setExperience(expSnap.docs.map(d => ({ id: d.id, ...d.data() as any })));
      setEducation(eduSnap.docs.map(d => ({ id: d.id, ...d.data() as any })));
      setTestimonials(tstSnap.docs.map(d => ({ id: d.id, ...d.data() as any })));
      setClients(cltSnap.docs.map(d => ({ id: d.id, ...d.data() as any })));
    } catch (err: any) {
      console.error(err);
      setStatus({ type: 'error', msg: 'Failed to sync with cloud' });
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, callback: (url: string) => void) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        const max_size = 800; // Optimize dimension for web/cards so they load instantly

        if (width > height) {
          if (width > max_size) {
            height *= max_size / width;
            width = max_size;
          }
        } else {
          if (height > max_size) {
            width *= max_size / height;
            height = max_size;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          // Convert to compressed jpeg which is incredibly small and safe for Firestore limit (usually ~40KB)
          const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
          callback(dataUrl);
        } else {
          callback(event.target?.result as string);
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleUpdateSettings = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setLoading(true);
    try {
      await setDoc(doc(db, 'site', 'settings'), siteSettings);
      localStorage.setItem('gst_slabs', JSON.stringify(siteSettings.gstSlabs || []));
      setStatus({ type: 'success', msg: 'Cloud settings updated!' });
    } catch (err: any) {
      console.error(err);
      setStatus({ type: 'error', msg: 'Cloud update failed' });
    } finally {
      setLoading(false);
      setTimeout(() => setStatus(null), 3000);
    }
  };

  const handleAddGstSlab = () => {
    const rateNum = parseFloat(newSlabRate);
    if (isNaN(rateNum) || rateNum < 0 || rateNum > 100) {
      alert("Please enter a valid rate between 0 and 100");
      return;
    }
    if (!newSlabLabel.trim()) {
      alert("Please enter a slab description");
      return;
    }

    const updatedSlabs = [
      ...(siteSettings.gstSlabs || []),
      { rate: rateNum, label: `${rateNum}% ${newSlabLabel.trim()}` }
    ];

    setSiteSettings({
      ...siteSettings,
      gstSlabs: updatedSlabs
    });

    // Save to local storage for local sync
    localStorage.setItem('gst_slabs', JSON.stringify(updatedSlabs));
    setNewSlabRate('');
    setNewSlabLabel('');
  };

  const handleDeleteGstSlab = (indexToDelete: number) => {
    const updatedSlabs = (siteSettings.gstSlabs || []).filter((_: any, idx: number) => idx !== indexToDelete);
    setSiteSettings({
      ...siteSettings,
      gstSlabs: updatedSlabs
    });
    localStorage.setItem('gst_slabs', JSON.stringify(updatedSlabs));
  };

  const handleResetGstSlabs = () => {
    const defaultSlabs = [
      { rate: 5, label: '5% SGST + CGST' },
      { rate: 12, label: '12% Med Supplies' },
      { rate: 18, label: '18% Luxury Clinical' }
    ];
    setSiteSettings({
      ...siteSettings,
      gstSlabs: defaultSlabs
    });
    localStorage.setItem('gst_slabs', JSON.stringify(defaultSlabs));
  };

  const toggleVisibility = (section: string) => {
    setSiteSettings({
      ...siteSettings,
      visibility: {
        ...siteSettings.visibility,
        [section]: !siteSettings.visibility[section]
      }
    });
  };

  const insertMarkdown = (syntax: string) => {
    if (!editingItem) return;
    const textarea = document.getElementById('blog-description-textarea') as HTMLTextAreaElement;
    const text = editingItem.item.desc || '';
    
    let start = 0;
    let end = 0;
    if (textarea) {
      start = textarea.selectionStart;
      end = textarea.selectionEnd;
    } else {
      start = text.length;
      end = text.length;
    }
    
    const selectedText = text.substring(start, end);
    
    let result = '';
    if (syntax === 'bold') {
      result = `**${selectedText || 'bold text'}**`;
    } else if (syntax === 'italic') {
      result = `*${selectedText || 'italic text'}*`;
    } else if (syntax === 'heading') {
      result = `\n## ${selectedText || 'Heading'}\n`;
    } else if (syntax === 'link') {
      result = `[${selectedText || 'link text'}](https://example.com)`;
    } else if (syntax === 'list') {
      result = `\n- ${selectedText || 'list item'}\n`;
    } else if (syntax === 'code') {
      result = `\`\`\`javascript\n${selectedText || '// code here'}\n\`\`\``;
    } else if (syntax === 'quote') {
      result = `\n> ${selectedText || 'quote text'}\n`;
    }

    const newText = text.substring(0, start) + result + text.substring(end);
    setEditingItem({
      ...editingItem,
      item: {
        ...editingItem.item,
        desc: newText
      }
    });

    if (textarea) {
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + result.length, start + result.length);
      }, 50);
    }
  };

  const handleAiGenerateOutline = async () => {
    if (!editingItem) return;
    if (!aiPrompt && !editingItem.item.title) {
      alert("Please enter an AI prompt idea or write a blog post title first!");
      return;
    }
    setAiLoading(true);
    setStatus({ type: 'success', msg: 'AI Copilot is composing blog draft...' });
    try {
      const res = await fetch('/api/admin/blog-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'generate_outline',
          title: editingItem.item.title || '',
          prompt: aiPrompt
        })
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      setEditingItem({
        ...editingItem,
        item: {
          ...editingItem.item,
          desc: data.text
        }
      });
      setBlogEditorTab('write');
      setStatus({ type: 'success', msg: 'Draft written by premium AI Copilot!' });
    } catch (err: any) {
      console.error(err);
      setStatus({ type: 'error', msg: err.message || 'AI assistant request failed' });
    } finally {
      setAiLoading(false);
      setTimeout(() => setStatus(null), 3000);
    }
  };

  const handleAiRefineText = async () => {
    if (!editingItem || !editingItem.item.desc) return;
    setAiLoading(true);
    setStatus({ type: 'success', msg: 'Grammar and formatting refinement in progress...' });
    try {
      const res = await fetch('/api/admin/blog-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'refine',
          desc: editingItem.item.desc
        })
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      setEditingItem({
        ...editingItem,
        item: {
          ...editingItem.item,
          desc: data.text
        }
      });
      setBlogEditorTab('write');
      setStatus({ type: 'success', msg: 'Blog copy refined & formatted successfully!' });
    } catch (err: any) {
      console.error(err);
      setStatus({ type: 'error', msg: err.message || 'Failed refining blog copy' });
    } finally {
      setAiLoading(false);
      setTimeout(() => setStatus(null), 3500);
    }
  };

  const handleAiAutoMeta = async () => {
    if (!editingItem) return;
    setAiLoading(true);
    setStatus({ type: 'success', msg: 'Creating search-optimized parameters & meta...' });
    try {
      const res = await fetch('/api/admin/blog-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'suggest_meta',
          title: editingItem.item.title || '',
          desc: editingItem.item.desc || ''
        })
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      let parsedMeta = { title: '', category: '', time: '', summary: '' };
      try {
        parsedMeta = JSON.parse(data.text);
      } catch {
        console.warn("AI metadata suggested non-strict JSON, trying regex fallback");
      }

      setEditingItem({
        ...editingItem,
        item: {
          ...editingItem.item,
          title: parsedMeta.title || editingItem.item.title || '',
          category: parsedMeta.category || editingItem.item.category || '',
          time: parsedMeta.time || editingItem.item.time || ''
        }
      });
      setStatus({ type: 'success', msg: 'Estimated reading duration and optimized SEO parameters updated!' });
    } catch (err: any) {
      console.error(err);
      const text = editingItem.item.desc || '';
      const wc = text.trim() ? text.trim().split(/\s+/).length : 0;
      const minRead = Math.max(1, Math.ceil(wc / 200));
      setEditingItem({
        ...editingItem,
        item: {
          ...editingItem.item,
          time: `${minRead} min read`
        }
      });
      setStatus({ type: 'success', msg: `Fallback reading duration: ${minRead} min read calculated.` });
    } finally {
      setAiLoading(false);
      setTimeout(() => setStatus(null), 3500);
    }
  };

  const renderSimpleMarkdown = (text: string) => {
    if (!text) return <p className="text-gray-400 italic font-medium text-xs">No content composed yet. Switch to "Write" tab to formulate draft!</p>;
    
    let html = text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

    html = html.replace(/```([\s\S]*?)```/g, '<pre class="bg-gray-100 dark:bg-slate-800 p-4 rounded-xl font-mono text-xs my-3 overflow-x-auto text-slate-800 dark:text-slate-200 border border-slate-200/40 dark:border-slate-700/40">$1</pre>');
    html = html.replace(/`([^`]+)`/g, '<code class="bg-gray-100 dark:bg-slate-800 px-1 py-0.5 rounded font-mono text-xs text-primary">$1</code>');
    html = html.replace(/^## (.*?)$/gm, '<h3 class="text-base font-black text-slate-900 dark:text-white mt-5 mb-1.5">$1</h3>');
    html = html.replace(/^### (.*?)$/gm, '<h4 class="text-sm font-bold text-slate-900 dark:text-white mt-4 mb-1.5">$1</h4>');
    html = html.replace(/^# (.*?)$/gm, '<h2 class="text-lg font-extrabold text-slate-950 dark:text-white mt-6 mb-3 border-b pb-1.5">$1</h2>');
    html = html.replace(/\*\*([^*]+)\*\*/g, '<strong class="font-bold text-slate-950 dark:text-white">$1</strong>');
    html = html.replace(/\*([^*]+)\*/g, '<em class="italic">$1</em>');
    html = html.replace(/^> (.*?)$/gm, '<blockquote class="border-l-4 border-primary pl-4 py-1.5 my-3 italic text-slate-600 dark:text-gray-400 bg-gray-50 dark:bg-slate-800/40 rounded-r-lg">$1</blockquote>');
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-primary underline hover:opacity-80">$1</a>');
    html = html.replace(/^\s*-\s+(.*?)$/gm, '<li class="list-disc ml-5 text-slate-800 dark:text-slate-200">$1</li>');
    html = html.replace(/\n/g, '<br />');

    return (
      <div 
        className="space-y-1.5 text-xs md:text-sm text-slate-800 dark:text-slate-200 leading-relaxed font-sans whitespace-pre-wrap select-text"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    );
  };

  const handleSaveItem = async () => {
    if (!editingItem) return;
    setLoading(true);
    try {
      if (editingItem.item.id) {
        // Update
        const { id, ...cleanData } = editingItem.item;
        await updateDoc(doc(db, editingItem.col, id), cleanData);
      } else {
        // Create
        await addDoc(collection(db, editingItem.col), editingItem.item);
      }
      setEditingItem(null);
      fetchData();
      setStatus({ type: 'success', msg: 'Content saved successfully' });
    } catch (err) {
      console.error(err);
      setStatus({ type: 'error', msg: 'Failed to save content' });
    } finally {
      setLoading(false);
      setTimeout(() => setStatus(null), 2000);
    }
  };

  const deleteItem = async (col: string, id: string) => {
    if (!confirm('Are you sure you want to delete this content?')) return;
    try {
      await deleteDoc(doc(db, col, id));
      fetchData();
    } catch (err) { console.error(err); }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-8 relative">
      {/* Edit Modal */}
      <AnimatePresence>
        {editingItem && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className={`bg-white w-full ${editingItem.col === 'blogs' ? 'max-w-3xl' : 'max-w-lg'} rounded-[2.5rem] p-8 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto`}
            >
              <div className="flex justify-between items-center">
                <h3 className="text-2xl font-black capitalize">Edit {editingItem.col.slice(0, -1)}</h3>
                <button onClick={() => setEditingItem(null)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                  <X />
                </button>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                    {editingItem.col === 'testimonials' ? 'Farmer Name' : (editingItem.col === 'experience' || editingItem.col === 'education' ? 'Position / Degree' : 'Title / Name')}
                  </label>
                  <input 
                    value={editingItem.item.title || editingItem.item.name || ''}
                    onChange={e => {
                      const val = e.target.value;
                      if (editingItem.col === 'testimonials' || editingItem.col === 'clients') {
                        setEditingItem({ ...editingItem, item: { ...editingItem.item, name: val } });
                      } else {
                        setEditingItem({ ...editingItem, item: { ...editingItem.item, title: val } });
                      }
                    }}
                    placeholder={editingItem.col === 'experience' ? 'Software Engineer' : ''}
                    className="w-full px-5 py-3 bg-gray-50 rounded-2xl border-none font-bold"
                  />
                </div>

                {(editingItem.col === 'experience' || editingItem.col === 'education') && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                        {editingItem.col === 'experience' ? 'Company' : 'Institution'}
                      </label>
                      <input 
                        value={editingItem.item.company || editingItem.item.institution || ''}
                        onChange={e => setEditingItem({ ...editingItem, item: { ...editingItem.item, [editingItem.col === 'experience' ? 'company' : 'institution']: e.target.value } })}
                        className="w-full px-5 py-3 bg-gray-50 rounded-2xl border-none font-bold"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Rating / Result</label>
                      <input 
                        value={editingItem.item.rating || ''}
                        onChange={e => setEditingItem({ ...editingItem, item: { ...editingItem.item, rating: e.target.value } })}
                        className="w-full px-5 py-3 bg-gray-50 rounded-2xl border-none font-bold"
                        placeholder="4.9/5"
                      />
                    </div>
                  </div>
                )}

                {editingItem.col !== 'clients' && (
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                      {editingItem.col === 'testimonials' ? 'Testimonial Quote' : 'Description / Body'}
                    </label>
                    {editingItem.col === 'blogs' ? (
                      <div className="space-y-4">
                        {/* Mode selector tab row */}
                        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => setBlogEditorTab('write')}
                              className={`px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                                blogEditorTab === 'write' 
                                  ? 'bg-primary text-white shadow-md shadow-primary/20 scale-102' 
                                  : 'bg-gray-50 text-gray-400 hover:text-gray-700 dark:bg-slate-900/60'
                              }`}
                            >
                              Write (Markdown)
                            </button>
                            <button
                              type="button"
                              onClick={() => setBlogEditorTab('preview')}
                              className={`px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                                blogEditorTab === 'preview' 
                                  ? 'bg-primary text-white shadow-md shadow-primary/20 scale-102' 
                                  : 'bg-gray-50 text-gray-400 hover:text-gray-700 dark:bg-slate-900/60'
                              }`}
                            >
                              Live Preview Layout
                            </button>
                          </div>

                          {/* Word and Character counters */}
                          <span className="text-[10px] font-black uppercase text-gray-400 tracking-wider">
                            {((editingItem.item.desc || '').trim() ? (editingItem.item.desc || '').trim().split(/\s+/).length : 0)} words
                          </span>
                        </div>

                        {blogEditorTab === 'write' ? (
                          <div className="space-y-3">
                            {/* WYSIWYG Toolbar */}
                            <div className="flex flex-wrap gap-1.5 p-2 bg-slate-50 dark:bg-slate-930 rounded-2xl border border-slate-100 dark:border-slate-800">
                              <button
                                type="button"
                                onClick={() => insertMarkdown('bold')}
                                className="px-3 py-1.5 bg-white dark:bg-slate-850 hover:bg-primary hover:text-white rounded-xl text-xs font-black border border-slate-100 dark:border-slate-750 transition shadow-sm cursor-pointer"
                                title="Bold Text (**bold**)"
                              >
                                Bold
                              </button>
                              <button
                                type="button"
                                onClick={() => insertMarkdown('italic')}
                                className="px-3 py-1.5 bg-white dark:bg-slate-850 hover:bg-primary hover:text-white rounded-xl text-xs font-bold italic border border-slate-100 dark:border-slate-750 transition shadow-sm cursor-pointer"
                                title="Italic Text (*italic*)"
                              >
                                Italic
                              </button>
                              <button
                                type="button"
                                onClick={() => insertMarkdown('heading')}
                                className="px-3 py-1.5 bg-white dark:bg-slate-850 hover:bg-primary hover:text-white rounded-xl text-[11px] font-extrabold border border-slate-100 dark:border-slate-750 transition shadow-sm cursor-pointer"
                                title="Heading 2 (## Heading)"
                              >
                                Heading H2
                              </button>
                              <button
                                type="button"
                                onClick={() => insertMarkdown('link')}
                                className="px-3 py-1.5 bg-white dark:bg-slate-850 hover:bg-primary hover:text-white rounded-xl text-[11px] font-extrabold border border-slate-100 dark:border-slate-750 transition shadow-sm cursor-pointer"
                                title="Insert Link ([text](url))"
                              >
                                Link URL
                              </button>
                              <button
                                type="button"
                                onClick={() => insertMarkdown('list')}
                                className="px-3 py-1.5 bg-white dark:bg-slate-850 hover:bg-primary hover:text-white rounded-xl text-[11px] font-extrabold border border-slate-100 dark:border-slate-750 transition shadow-sm cursor-pointer"
                                title="Bulleted List (- item)"
                              >
                                List Item
                              </button>
                              <button
                                type="button"
                                onClick={() => insertMarkdown('code')}
                                className="px-3 py-1.5 bg-white dark:bg-slate-850 hover:bg-primary hover:text-white rounded-xl text-[11px] font-mono font-extrabold border border-slate-100 dark:border-slate-750 transition shadow-sm cursor-pointer"
                                title="Code Block"
                              >
                                Code block
                              </button>
                              <button
                                type="button"
                                onClick={() => insertMarkdown('quote')}
                                className="px-3 py-1.5 bg-white dark:bg-slate-850 hover:bg-primary hover:text-white rounded-xl text-[11px] font-extrabold border border-slate-100 dark:border-slate-750 transition shadow-sm cursor-pointer"
                                title="Quote"
                              >
                                Quote block
                              </button>
                            </div>

                            {/* Description textarea */}
                            <textarea
                              id="blog-description-textarea"
                              value={editingItem.item.desc || ''}
                              onChange={e => setEditingItem({ ...editingItem, item: { ...editingItem.item, desc: e.target.value } })}
                              className="w-full px-5 py-4 bg-gray-50 focus:bg-white dark:bg-slate-900/40 rounded-3xl border border-slate-100 dark:border-slate-800/40 font-medium min-h-[220px] max-h-[450px] text-sm leading-relaxed"
                              placeholder="Compose your premium blog post here... Markdown styling is supported! Use formatting tools above for easy structure."
                            />
                          </div>
                        ) : (
                          <div className="bg-slate-50 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-800/60 p-6 rounded-3xl min-h-[220px] max-h-[450px] overflow-y-auto custom-scrollbar">
                            {renderSimpleMarkdown(editingItem.item.desc || '')}
                          </div>
                        )}

                        {/* AI Copilot Panel */}
                        <div className="p-5 bg-gradient-to-br from-indigo-50/50 to-purple-50/10 dark:from-indigo-950/20 dark:to-slate-900/40 border border-indigo-100/50 dark:border-indigo-900/40 rounded-3xl space-y-4">
                          <div className="flex items-center gap-2">
                            <span className="flex h-2.5 w-2.5 rounded-full bg-indigo-500 animate-pulse" />
                            <h4 className="text-xs font-black uppercase text-indigo-950 dark:text-indigo-200 tracking-widest flex items-center gap-1.5">
                              Gemini Blog Copilot
                            </h4>
                          </div>

                          <div className="flex flex-col md:flex-row gap-4 items-end">
                            {/* Generation prompt input */}
                            <div className="space-y-2 flex-grow w-full">
                              <label className="text-[10px] font-black uppercase text-indigo-900/60 dark:text-indigo-300 block">AI Post Outline / Idea Prompt</label>
                              <input
                                type="text"
                                value={aiPrompt}
                                onChange={e => setAiPrompt(e.target.value)}
                                placeholder="e.g., Explain why React Server Components are great for Core Web Vitals with code outline"
                                className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-indigo-100 dark:border-slate-850 rounded-2xl text-xs font-bold"
                              />
                            </div>

                            {/* Action triggers */}
                            <div className="flex gap-2 w-full md:w-auto">
                              <button
                                type="button"
                                disabled={aiLoading}
                                onClick={handleAiGenerateOutline}
                                className="px-4 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-md shadow-indigo-600/10 cursor-pointer flex-grow md:flex-none whitespace-nowrap"
                              >
                                {aiLoading ? 'Composing...' : 'Write Draft'}
                              </button>
                              <button
                                type="button"
                                disabled={aiLoading || !editingItem.item.desc}
                                onClick={handleAiRefineText}
                                className="px-4 py-3 bg-slate-850 hover:bg-slate-900 dark:bg-slate-700 dark:hover:bg-slate-600 disabled:opacity-50 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-md shadow-slate-850/10 cursor-pointer flex-grow md:flex-none whitespace-nowrap"
                                title="Fix grammar, format headers and polish paragraphs"
                              >
                                {aiLoading ? 'Refining...' : 'Refine Body'}
                              </button>
                              <button
                                type="button"
                                disabled={aiLoading}
                                onClick={handleAiAutoMeta}
                                className="px-4 py-3 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-md shadow-teal-600/10 cursor-pointer flex-grow md:flex-none whitespace-nowrap"
                                title="Suggest optimized title, category, and read duration"
                              >
                                Auto SEO
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <textarea 
                        value={editingItem.item.desc || editingItem.item.quote || ''}
                        onChange={e => {
                          const val = e.target.value;
                          if (editingItem.col === 'testimonials') {
                            setEditingItem({ ...editingItem, item: { ...editingItem.item, quote: val } });
                          } else {
                            setEditingItem({ ...editingItem, item: { ...editingItem.item, desc: val } });
                          }
                        }}
                        className="w-full px-5 py-3 bg-gray-50 rounded-2xl border-none font-medium min-h-[120px]"
                      />
                    )}
                  </div>
                )}

                {(editingItem.col === 'projects' || editingItem.col === 'courses' || editingItem.col === 'blogs' || editingItem.col === 'testimonials' || editingItem.col === 'clients') && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Image / Logo URL</label>
                      <div className="flex flex-col space-y-2">
                        <input 
                          value={editingItem.item.image || ''}
                          onChange={e => setEditingItem({ ...editingItem, item: { ...editingItem.item, image: e.target.value } })}
                          className="w-full px-5 py-3 bg-gray-50 rounded-2xl border-none font-medium text-sm"
                          placeholder="Image URL..."
                        />
                        <div className="flex gap-2">
                          <label className="px-4 py-2 bg-gray-50 hover:bg-gray-200 rounded-xl text-[10px] font-black uppercase cursor-pointer transition-colors">
                            Upload File
                            <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e, (url) => setEditingItem({ ...editingItem, item: { ...editingItem.item, image: url } }))} />
                          </label>
                        </div>
                      </div>
                    </div>
                    {editingItem.item.image && (
                      <div className="w-full h-40 rounded-2xl bg-gray-100 overflow-hidden border">
                        <img src={editingItem.item.image} alt="" className="w-full h-full object-cover shadow-inner" />
                      </div>
                    )}
                  </div>
                )}

                {editingItem.col === 'testimonials' && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Role</label>
                      <input 
                        value={editingItem.item.role || ''}
                        onChange={e => setEditingItem({ ...editingItem, item: { ...editingItem.item, role: e.target.value } })}
                        className="w-full px-5 py-3 bg-gray-50 rounded-2xl border-none font-bold"
                        placeholder="CEO / Manager..."
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Company</label>
                      <input 
                        value={editingItem.item.company || ''}
                        onChange={e => setEditingItem({ ...editingItem, item: { ...editingItem.item, company: e.target.value } })}
                        className="w-full px-5 py-3 bg-gray-50 rounded-2xl border-none font-bold"
                        placeholder="Organization Name"
                      />
                    </div>
                  </div>
                )}

                {editingItem.col === 'blogs' && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Category</label>
                      <input 
                        value={editingItem.item.category || ''}
                        onChange={e => setEditingItem({ ...editingItem, item: { ...editingItem.item, category: e.target.value } })}
                        className="w-full px-5 py-3 bg-gray-50 rounded-2xl border-none font-bold"
                        placeholder="Tech / Life..."
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Read Time</label>
                      <input 
                        value={editingItem.item.time || ''}
                        onChange={e => setEditingItem({ ...editingItem, item: { ...editingItem.item, time: e.target.value } })}
                        className="w-full px-5 py-3 bg-gray-50 rounded-2xl border-none font-bold"
                        placeholder="5 min read"
                      />
                    </div>
                  </div>
                )}

                {editingItem.col === 'projects' && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Subtitle / Tagline</label>
                      <input 
                        value={editingItem.item.subtitle || ''}
                        onChange={e => setEditingItem({ ...editingItem, item: { ...editingItem.item, subtitle: e.target.value } })}
                        className="w-full px-5 py-3 bg-gray-50 rounded-2xl border-none font-bold"
                        placeholder="Enterprise Solution..."
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Category</label>
                        <select 
                          value={editingItem.item.category || ''}
                          onChange={e => setEditingItem({ ...editingItem, item: { ...editingItem.item, category: e.target.value } })}
                          className="w-full px-5 py-3 bg-gray-50 rounded-2xl border-none font-bold"
                        >
                          <option value="">Select Category</option>
                          <option value="web">Web</option>
                          <option value="app">App</option>
                          <option value="design">Design</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Developer Role</label>
                        <input 
                          value={editingItem.item.role || ''}
                          onChange={e => setEditingItem({ ...editingItem, item: { ...editingItem.item, role: e.target.value } })}
                          className="w-full px-5 py-3 bg-gray-50 rounded-2xl border-none font-bold"
                          placeholder="Full Stack Developer"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Tech Stack (Comma separated)</label>
                      <input 
                        value={editingItem.item.tech?.join(', ') || ''}
                        onChange={e => setEditingItem({ ...editingItem, item: { ...editingItem.item, tech: e.target.value.split(',').map(s => s.trim()).filter(s => s !== '') } })}
                        className="w-full px-5 py-3 bg-gray-50 rounded-2xl border-none font-bold"
                        placeholder="React, Node.js, Firebase..."
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Project Overview</label>
                      <textarea 
                        value={editingItem.item.overview || ''}
                        onChange={e => setEditingItem({ ...editingItem, item: { ...editingItem.item, overview: e.target.value } })}
                        className="w-full px-5 py-3 bg-gray-50 rounded-2xl border-none font-medium min-h-[100px]"
                        placeholder="Detailed project description..."
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Demo URL / Link</label>
                      <input 
                        value={editingItem.item.demoUrl || ''}
                        onChange={e => setEditingItem({ ...editingItem, item: { ...editingItem.item, demoUrl: e.target.value } })}
                        className="w-full px-5 py-3 bg-gray-50 rounded-2xl border-none font-bold text-primary"
                        placeholder="https://demo-link.com"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Core Features (One per line)</label>
                      <textarea 
                        value={editingItem.item.features?.join('\n') || ''}
                        onChange={e => setEditingItem({ ...editingItem, item: { ...editingItem.item, features: e.target.value.split('\n').map(s => s.trim()).filter(s => s !== '') } })}
                        className="w-full px-5 py-3 bg-gray-50 rounded-2xl border-none font-medium min-h-[100px]"
                        placeholder="Feature 1&#10;Feature 2&#10;Feature 3"
                      />
                    </div>
                  </div>
                )}

                {editingItem.col === 'courses' && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Price</label>
                      <input 
                        value={editingItem.item.price || ''}
                        onChange={e => setEditingItem({ ...editingItem, item: { ...editingItem.item, price: e.target.value } })}
                        className="w-full px-5 py-3 bg-gray-50 rounded-2xl border-none font-bold"
                        placeholder="Ex: ₹1,999"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Duration</label>
                      <input 
                        value={editingItem.item.duration || ''}
                        onChange={e => setEditingItem({ ...editingItem, item: { ...editingItem.item, duration: e.target.value } })}
                        className="w-full px-5 py-3 bg-gray-50 rounded-2xl border-none font-bold"
                        placeholder="Ex: 3 Months"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-6">
                <button 
                  onClick={handleSaveItem}
                  className="w-full py-4 bg-primary text-white rounded-2xl font-bold shadow-xl shadow-primary/20"
                >
                  Save Changes
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sidebar Tabs */}
      <div className="w-full lg:w-64 space-y-2">
        {[
          { id: 'hero', label: 'Hero & Basics', icon: Home },
          { id: 'visibility', label: 'Page Sections', icon: Eye },
          { id: 'headings', label: 'Section Titles', icon: SettingsIcon },
          { id: 'contact', label: 'Contact Details', icon: Mail },
          { id: 'social', label: 'Social Media', icon: Share2 },
          { id: 'content', label: 'Dynamic Content', icon: Type },
          { id: 'global', label: 'Global Settings', icon: SettingsIcon }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`w-full flex items-center gap-3 px-6 py-4 rounded-2xl font-bold transition-all ${activeTab === tab.id ? 'bg-primary text-white shadow-xl shadow-primary/20 scale-[1.02]' : 'bg-white text-gray-500 hover:bg-gray-50 border border-gray-100'}`}
          >
            <tab.icon size={20} />
            {tab.label}
          </button>
        ))}
        
        <div className="pt-8">
          <button 
            onClick={() => handleUpdateSettings()}
            disabled={loading}
            className="w-full py-4 bg-gray-900 text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-black transition-all shadow-xl"
          >
            {loading ? 'Saving...' : 'Deploy Changes'}
            <Save size={18} />
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 min-w-0 pb-20">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="bg-white rounded-[2rem] p-8 shadow-sm border border-gray-100 min-h-[600px]"
          >
            {activeTab === 'hero' && (
              <div className="space-y-8">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
                    <Home size={24} />
                  </div>
                  <h2 className="text-2xl font-black text-gray-900">Hero & Header</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Welcome Text</label>
                    <input 
                      value={siteSettings.heroTitle}
                      onChange={e => setSiteSettings({...siteSettings, heroTitle: e.target.value})}
                      className="w-full px-5 py-4 bg-gray-50 rounded-2xl border-none font-bold text-gray-800 focus:ring-2 focus:ring-primary/20 transition-all"
                      placeholder="Hi, I'm"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Display Name</label>
                    <input 
                      value={siteSettings.heroName}
                      onChange={e => setSiteSettings({...siteSettings, heroName: e.target.value})}
                      className="w-full px-5 py-4 bg-gray-50 rounded-2xl border-none font-bold text-gray-800 focus:ring-2 focus:ring-primary/20 transition-all"
                      placeholder="Your Name"
                    />
                  </div>
                  <div className="col-span-1 md:col-span-2 space-y-2">
                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Short Bio</label>
                    <textarea 
                      value={siteSettings.heroDesc}
                      onChange={e => setSiteSettings({...siteSettings, heroDesc: e.target.value})}
                      className="w-full px-5 py-4 bg-gray-50 rounded-2xl border-none font-bold text-gray-800 focus:ring-2 focus:ring-primary/20 transition-all min-h-[120px] resize-none"
                      placeholder="Professional developer with experience in..."
                    />
                  </div>
                  <div className="col-span-1 md:col-span-2 space-y-2">
                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Hero Image</label>
                    <div className="flex gap-4">
                      <div className="flex flex-col flex-1 space-y-2">
                        <input 
                          value={siteSettings.heroImage}
                          onChange={e => setSiteSettings({...siteSettings, heroImage: e.target.value})}
                          className="w-full px-5 py-3 bg-gray-50 rounded-2xl border-none font-medium truncate text-sm"
                          placeholder="Image URL..."
                        />
                        <div className="flex gap-2">
                          <label className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-xl text-[10px] font-black uppercase cursor-pointer transition-colors">
                            Upload Image
                            <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e, (url) => setSiteSettings({...siteSettings, heroImage: url}))} />
                          </label>
                        </div>
                      </div>
                      <div className="w-20 h-20 rounded-2xl bg-gray-100 flex items-center justify-center overflow-hidden border border-gray-100 flex-shrink-0">
                        {siteSettings.heroImage ? <img src={siteSettings.heroImage} alt="" className="w-full h-full object-cover" /> : <Camera size={20} className="text-gray-300" />}
                      </div>
                    </div>
                  </div>
                  <div className="col-span-1 md:col-span-2 space-y-2 border-t pt-6">
                    <label className="text-xs font-black text-primary uppercase tracking-widest ml-1 flex items-center gap-2">
                      <Camera size={14} /> Navbar Logo (Site Identity)
                    </label>
                    <div className="flex gap-4">
                      <div className="flex flex-col flex-1 space-y-2">
                        <input 
                          value={siteSettings.siteLogo}
                          onChange={e => setSiteSettings({...siteSettings, siteLogo: e.target.value})}
                          className="w-full px-5 py-3 bg-gray-50 rounded-2xl border-none font-medium truncate text-sm"
                          placeholder="Navbar Logo URL..."
                        />
                        <div className="flex gap-2">
                          <label className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-xl text-[10px] font-black uppercase cursor-pointer transition-colors">
                            Change Logo
                            <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e, (url) => setSiteSettings({...siteSettings, siteLogo: url}))} />
                          </label>
                        </div>
                      </div>
                      <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center overflow-hidden border-2 border-primary/20 flex-shrink-0">
                        {siteSettings.siteLogo ? <img src={siteSettings.siteLogo} alt="Logo" className="w-full h-full object-cover" /> : <SettingsIcon size={20} className="text-gray-300" />}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'headings' && (
              <div className="space-y-8 text-sm">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
                    <SettingsIcon size={24} />
                  </div>
                  <h2 className="text-2xl font-black text-gray-900">Section Text & Headings</h2>
                </div>

                <div className="grid grid-cols-1 gap-6">
                  {Object.keys(siteSettings.headings).map(section => (
                    <div key={section} className="p-6 bg-gray-50 rounded-3xl space-y-4">
                      <h4 className="font-black uppercase tracking-widest text-primary text-xs">{section} Section</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-gray-400">Subtitle</label>
                          <input 
                            value={siteSettings.headings[section].subtitle}
                            onChange={e => setSiteSettings({
                             ...siteSettings,
                              headings: { 
                                ...siteSettings.headings, 
                                [section]: { ...siteSettings.headings[section], subtitle: e.target.value }
                              }
                            })}
                            className="w-full px-4 py-2 bg-white rounded-xl border-none font-bold"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-gray-400">Main Title</label>
                          <input 
                            value={siteSettings.headings[section].title}
                            onChange={e => setSiteSettings({
                             ...siteSettings,
                              headings: { 
                                ...siteSettings.headings, 
                                [section]: { ...siteSettings.headings[section], title: e.target.value }
                              }
                            })}
                            className="w-full px-4 py-2 bg-white rounded-xl border-none font-bold"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'visibility' && (
              <div className="space-y-8">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-purple-50 text-purple-600 rounded-2xl">
                    <Eye size={24} />
                  </div>
                  <h2 className="text-2xl font-black text-gray-900">Manage Sections</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.keys(siteSettings.visibility).map(section => (
                    <button
                      key={section}
                      id={`sect-toggle-${section}`}
                      onClick={() => toggleVisibility(section)}
                      className={`flex items-center justify-between p-6 rounded-[1.5rem] border-2 transition-all ${siteSettings.visibility[section] ? 'border-primary/20 bg-primary/5' : 'border-gray-100 bg-white'}`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${siteSettings.visibility[section] ? 'bg-primary text-white' : 'bg-gray-100 text-gray-400'}`}>
                          {siteSettings.visibility[section] ? <Eye size={18} id={`eye-icon-on-${section}`} /> : <EyeOff size={18} id={`eye-icon-off-${section}`} />}
                        </div>
                        <span className={`font-bold ${siteSettings.visibility[section] ? 'text-gray-900' : 'text-gray-400'}`}>
                          {section === 'spectatorArena' ? 'Spectator Scoreboard' :
                           section === 'verifiedRoster' ? 'Verified League Roster' :
                           section === 'aiChat' ? 'AI Assistant Chat' :
                           section === 'newsLaunchpad' ? 'Cricket News Agency' :
                           section === 'bestSkills' ? 'Featured Skills' :
                           section.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                        </span>
                      </div>
                      <div className={`w-10 h-6 rounded-full relative transition-colors ${siteSettings.visibility[section] ? 'bg-primary' : 'bg-gray-200'}`}>
                        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${siteSettings.visibility[section] ? 'right-1' : 'left-1'}`} />
                      </div>
                    </button>
                  ))}
                  <div className="col-span-1 md:col-span-2 p-8 bg-gray-50 rounded-[2.5rem] mt-6 border border-gray-100">
                    <div className="flex items-center justify-between mb-6">
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                        <Briefcase size={12} className="text-primary" /> Portfolio Display Architecture
                      </p>
                      <span className="px-3 py-1 bg-primary/10 text-primary text-[9px] font-black rounded-full uppercase tracking-widest">Layout Control</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <button
                        type="button"
                        onClick={() => setSiteSettings({...siteSettings, portfolioStyle: 'grid'})}
                        className={`flex items-center justify-center gap-3 px-6 py-5 rounded-2xl text-xs font-black uppercase tracking-[0.1em] transition-all transform active:scale-95 ${siteSettings.portfolioStyle === 'grid' ? 'bg-primary text-white shadow-2xl shadow-primary/30 -translate-y-1' : 'bg-white text-gray-400 border border-gray-200 hover:text-primary hover:border-primary/30'}`}
                      >
                        <div className="grid grid-cols-2 gap-0.5 opacity-80 group-hover:opacity-100">
                          <div className="w-2 h-2 bg-current rounded-sm"></div>
                          <div className="w-2 h-2 bg-current rounded-sm"></div>
                          <div className="w-2 h-2 bg-current rounded-sm"></div>
                          <div className="w-2 h-2 bg-current rounded-sm"></div>
                        </div>
                        Classic Grid
                      </button>
                      <button
                        type="button"
                        onClick={() => setSiteSettings({...siteSettings, portfolioStyle: 'scroll'})}
                        className={`flex items-center justify-center gap-3 px-6 py-5 rounded-2xl text-xs font-black uppercase tracking-[0.1em] transition-all transform active:scale-95 ${siteSettings.portfolioStyle === 'scroll' ? 'bg-primary text-white shadow-2xl shadow-primary/30 -translate-y-1' : 'bg-white text-gray-400 border border-gray-200 hover:text-primary hover:border-primary/30'}`}
                      >
                        <div className="flex gap-1 overflow-hidden w-5 items-center opacity-80">
                          <div className="w-2 h-3.5 flex-shrink-0 bg-current rounded-sm"></div>
                          <div className="w-2 h-3.5 flex-shrink-0 bg-current rounded-sm"></div>
                          <div className="w-2 h-3.5 flex-shrink-0 bg-current rounded-sm"></div>
                        </div>
                        Modern Scroll
                      </button>
                    </div>
                    <p className="mt-4 text-[10px] text-gray-400 font-medium italic text-center">
                      *Scroll list provides a horizontal narrative experience while Classic Grid offers a quick overview of all projects.
                    </p>
                  </div>
                  <div className="col-span-1 md:col-span-2 p-6 bg-gray-50 rounded-3xl mt-4">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Hero Content Specifics</p>
                    <label className="text-xs font-bold text-gray-700 block mb-2 underline">Manage Hero Skills list (Comma Separated)</label>
                    <input 
                      value={siteSettings.heroSkills?.join(', ') || ''}
                      onChange={e => setSiteSettings({...siteSettings, heroSkills: e.target.value.split(',').map(s => s.trim()).filter(s => s !== '')})}
                      className="w-full px-5 py-3 bg-white rounded-xl border border-gray-100 font-bold text-sm"
                      placeholder="React, Node.js, TypeScript..."
                    />
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'contact' && (
              <div className="space-y-8 text-sm">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-red-50 text-red-600 rounded-2xl">
                    <Mail size={24} />
                  </div>
                  <h2 className="text-2xl font-black text-gray-900">Contact Details</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Contact Name/Title</label>
                    <input 
                      value={siteSettings.contactTitle || ''}
                      onChange={e => setSiteSettings({...siteSettings, contactTitle: e.target.value})}
                      className="w-full px-5 py-3.5 bg-gray-50 rounded-2xl border-none font-bold text-gray-800"
                      placeholder="e.g. Shubham Hingane"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Contact Job/Profession</label>
                    <input 
                      value={siteSettings.contactJob || ''}
                      onChange={e => setSiteSettings({...siteSettings, contactJob: e.target.value})}
                      className="w-full px-5 py-3.5 bg-gray-50 rounded-2xl border-none font-bold text-gray-800"
                      placeholder="e.g. Computer Engineer & Developer"
                    />
                  </div>
                  <div className="col-span-1 md:col-span-2 space-y-2">
                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Contact Bio/Description</label>
                    <textarea 
                      value={siteSettings.contactDesc || ''}
                      onChange={e => setSiteSettings({...siteSettings, contactDesc: e.target.value})}
                      className="w-full px-5 py-3.5 bg-gray-50 rounded-2xl border-none font-bold text-gray-800 min-h-[100px] resize-none"
                      placeholder="e.g. Pune-based computer engineer specialising in web apps..."
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Display Email Address</label>
                    <input 
                      type="email"
                      value={siteSettings.contactEmail || ''}
                      onChange={e => setSiteSettings({...siteSettings, contactEmail: e.target.value})}
                      className="w-full px-5 py-3.5 bg-gray-50 rounded-2xl border-none font-bold text-gray-800"
                      placeholder="e.g. shubhamhingane7719@gmail.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Display Phone Number</label>
                    <input 
                      value={siteSettings.contactPhone || ''}
                      onChange={e => setSiteSettings({...siteSettings, contactPhone: e.target.value})}
                      className="w-full px-5 py-3.5 bg-gray-50 rounded-2xl border-none font-bold text-gray-800"
                      placeholder="e.g. +91 77199 59593"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">WhatsApp Target Number (Pure digits only)</label>
                    <input 
                      value={siteSettings.contactWhatsapp || ''}
                      onChange={e => setSiteSettings({...siteSettings, contactWhatsapp: e.target.value.replace(/\D/g, '')})}
                      className="w-full px-5 py-3.5 bg-gray-50 rounded-2xl border-none font-bold text-gray-800"
                      placeholder="e.g. 7719959593"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Office Timings / Hours</label>
                    <input 
                      value={siteSettings.contactHours || ''}
                      onChange={e => setSiteSettings({...siteSettings, contactHours: e.target.value})}
                      className="w-full px-5 py-3.5 bg-gray-50 rounded-2xl border-none font-bold text-gray-800"
                      placeholder="e.g. Monday - Friday: 9:00 AM - 6:00 PM"
                    />
                  </div>
                  <div className="col-span-1 md:col-span-2 space-y-2 border-t pt-4">
                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Contact Office Image</label>
                    <div className="flex gap-4">
                      <div className="flex flex-col flex-1 space-y-2">
                        <input 
                          value={siteSettings.contactImage || ''}
                          onChange={e => setSiteSettings({...siteSettings, contactImage: e.target.value})}
                          className="w-full px-5 py-3 bg-gray-50 rounded-2xl border-none font-medium truncate text-sm"
                          placeholder="Image URL..."
                        />
                        <div className="flex gap-2">
                          <label className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-xl text-[10px] font-black uppercase cursor-pointer transition-colors">
                            Upload Pic
                            <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e, (url) => setSiteSettings({...siteSettings, contactImage: url}))} />
                          </label>
                        </div>
                      </div>
                      <div className="w-20 h-20 rounded-2xl bg-gray-100 flex items-center justify-center overflow-hidden border border-gray-100 flex-shrink-0">
                        {siteSettings.contactImage ? <img src={siteSettings.contactImage} alt="" className="w-full h-full object-cover" /> : <Camera size={20} className="text-gray-300" />}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'social' && (
              <div className="space-y-8">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-pink-50 text-pink-600 rounded-2xl">
                    <Share2 size={24} />
                  </div>
                  <h2 className="text-2xl font-black text-gray-900">Social Media Links</h2>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  {Object.keys(siteSettings.socials).map(platform => (
                    <div key={platform} className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">{platform}</label>
                      <div className="relative">
                        <input 
                          value={siteSettings.socials[platform]}
                          onChange={e => setSiteSettings({
                            ...siteSettings,
                            socials: { ...siteSettings.socials, [platform]: e.target.value }
                          })}
                          placeholder={`https://${platform}.com/username`}
                          className="w-full pl-14 pr-5 py-4 bg-gray-50 rounded-2xl border-none font-bold text-gray-800 focus:ring-2 focus:ring-primary/20 transition-all"
                        />
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold uppercase text-[10px]">
                          URL
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'content' && (
              <div className="space-y-12">
                {/* Services */}
                <div>
                  <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center gap-3">
                      <Globe size={20} className="text-primary" />
                      <h3 className="text-xl font-bold">Services</h3>
                    </div>
                    <button onClick={() => setEditingItem({ col: 'services', item: {} })} className="p-2 bg-primary text-white rounded-xl">
                      <Plus size={18} />
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {services.map(s => (
                      <div key={s.id} className="p-4 bg-gray-50 rounded-2xl flex justify-between items-center group">
                        <span className="font-bold text-gray-700 truncate pr-4">{s.title}</span>
                        <div className="flex items-center gap-2">
                          <button onClick={() => setEditingItem({ col: 'services', item: s })} className="p-2 text-primary hover:bg-white rounded-lg transition-colors">
                            <Edit3 size={16} />
                          </button>
                          <button onClick={() => deleteItem('services', s.id)} className="p-2 text-red-400 hover:bg-white rounded-lg transition-colors">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Courses */}
                <div>
                  <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center gap-3">
                      <BookOpen size={20} className="text-primary" />
                      <h3 className="text-xl font-bold">Courses</h3>
                    </div>
                    <button onClick={() => setEditingItem({ col: 'courses', item: {} })} className="p-2 bg-primary text-white rounded-xl">
                      <Plus size={18} />
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {courses.map(c => (
                      <div key={c.id} className="p-4 bg-gray-50 rounded-2xl flex items-center gap-4 group">
                        <div className="w-10 h-10 rounded-lg bg-gray-200 overflow-hidden"><img src={c.image} alt="" className="w-full h-full object-cover" /></div>
                        <span className="font-bold text-gray-700 flex-1 truncate">{c.title}</span>
                        <div className="flex items-center gap-2">
                          <button onClick={() => setEditingItem({ col: 'courses', item: c })} className="p-2 text-primary hover:bg-white rounded-lg transition-colors">
                            <Edit3 size={16} />
                          </button>
                          <button onClick={() => deleteItem('courses', c.id)} className="p-2 text-red-400 hover:bg-white rounded-lg transition-colors">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Projects */}
                <div>
                  <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center gap-3">
                      <Briefcase size={20} className="text-primary" />
                      <h3 className="text-xl font-bold">Projects</h3>
                    </div>
                    <button onClick={() => setEditingItem({ col: 'projects', item: {} })} className="p-2 bg-primary text-white rounded-xl">
                      <Plus size={18} />
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {projects.map(p => (
                      <div key={p.id} className="p-4 bg-gray-50 rounded-2xl flex items-center gap-4 group">
                        <div className="w-12 h-12 rounded-lg bg-gray-200 overflow-hidden border border-gray-100">
                          <img src={p.image} alt="" className="w-full h-full object-cover" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="font-bold text-gray-800 block truncate">{p.title}</span>
                          <span className="text-[10px] font-black uppercase text-primary bg-primary/10 px-2 py-0.5 rounded-md inline-block mt-1">
                            {p.category || 'Portfolio'}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button onClick={() => setEditingItem({ col: 'projects', item: p })} className="p-2 text-primary hover:bg-white rounded-lg transition-colors shadow-sm">
                            <Edit3 size={16} />
                          </button>
                          <button onClick={() => deleteItem('projects', p.id)} className="p-2 text-red-500 hover:bg-white rounded-lg transition-colors shadow-sm">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Blog Posts */}
                <div>
                  <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center gap-3">
                      <BookOpen size={20} className="text-primary" />
                      <h3 className="text-xl font-bold">Blog Posts</h3>
                    </div>
                    <button 
                      onClick={() => setEditingItem({ col: 'blogs', item: { createdAt: new Date().toISOString() } })} 
                      className="p-2 bg-primary text-white rounded-xl"
                    >
                      <Plus size={18} />
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {blogs.map(b => (
                      <div key={b.id} className="p-4 bg-gray-50 rounded-2xl flex items-center gap-4 group">
                        <div className="w-10 h-10 rounded-lg bg-gray-200 overflow-hidden">
                          <img src={b.image} alt="" className="w-full h-full object-cover" />
                        </div>
                        <span className="font-bold text-gray-700 flex-1 truncate">{b.title}</span>
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => setEditingItem({ col: 'blogs', item: b })} 
                            className="p-2 text-primary hover:bg-white rounded-lg transition-colors"
                          >
                            <Edit3 size={16} />
                          </button>
                          <button 
                            onClick={() => deleteItem('blogs', b.id)} 
                            className="p-2 text-red-400 hover:bg-white rounded-lg transition-colors"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    ))}
                    {blogs.length === 0 && (
                      <p className="col-span-1 md:col-span-2 text-center text-gray-400 py-8 font-medium">No blog posts found. Add your first post!</p>
                    )}
                  </div>
                </div>

                {/* Testimonials */}
                <div>
                  <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center gap-3">
                      <Share2 size={20} className="text-primary" />
                      <h3 className="text-xl font-bold">Testimonials</h3>
                    </div>
                    <button onClick={() => setEditingItem({ col: 'testimonials', item: {} })} className="p-2 bg-primary text-white rounded-xl">
                      <Plus size={18} />
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {testimonials.map(t => (
                      <div key={t.id} className="p-4 bg-gray-50 rounded-2xl flex items-center gap-4 group">
                        <div className="w-10 h-10 rounded-lg bg-gray-200 overflow-hidden"><img src={t.image} alt="" className="w-full h-full object-cover" /></div>
                        <span className="font-bold text-gray-700 flex-1 truncate">{t.name}</span>
                        <div className="flex items-center gap-2">
                          <button onClick={() => setEditingItem({ col: 'testimonials', item: t })} className="p-2 text-primary hover:bg-white rounded-lg transition-colors">
                            <Edit3 size={16} />
                          </button>
                          <button onClick={() => deleteItem('testimonials', t.id)} className="p-2 text-red-400 hover:bg-white rounded-lg transition-colors">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Resume Sections */}
                <div className="border-t pt-10">
                  <div className="flex items-center gap-3 mb-8">
                    <Briefcase size={20} className="text-primary" />
                    <h3 className="text-xl font-bold">Resume / Journey</h3>
                  </div>
                  
                  <div className="space-y-10">
                    {/* Experience */}
                    <div className="bg-gray-50/50 p-6 rounded-[2rem]">
                      <div className="flex justify-between items-center mb-6">
                        <label className="text-sm font-black uppercase tracking-widest text-gray-400">Professional Experience</label>
                        <button onClick={() => setEditingItem({ col: 'experience', item: {} })} className="p-2 bg-primary text-white rounded-xl">
                          <Plus size={16} />
                        </button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {experience.map(exp => (
                          <div key={exp.id} className="p-4 bg-white rounded-2xl flex justify-between items-center shadow-sm border border-gray-100">
                            <div>
                              <p className="font-black text-sm">{exp.title}</p>
                              <p className="text-[10px] text-primary font-bold uppercase tracking-wider">{exp.company}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <button onClick={() => setEditingItem({ col: 'experience', item: exp })} className="p-2 text-primary">
                                <Edit3 size={16} />
                              </button>
                              <button onClick={() => deleteItem('experience', exp.id)} className="p-2 text-red-400">
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Education */}
                    <div className="bg-gray-50/50 p-6 rounded-[2rem]">
                      <div className="flex justify-between items-center mb-6">
                        <label className="text-sm font-black uppercase tracking-widest text-gray-400">Education & Certs</label>
                        <button onClick={() => setEditingItem({ col: 'education', item: {} })} className="p-2 bg-primary text-white rounded-xl">
                          <Plus size={16} />
                        </button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {education.map(edu => (
                          <div key={edu.id} className="p-4 bg-white rounded-2xl flex justify-between items-center shadow-sm border border-gray-100">
                            <div>
                                <p className="font-black text-sm">{edu.title}</p>
                                <p className="text-[10px] text-primary font-bold uppercase tracking-wider">{edu.institution}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <button onClick={() => setEditingItem({ col: 'education', item: edu })} className="p-2 text-primary hover:bg-gray-50 rounded-lg">
                                <Edit3 size={16} />
                              </button>
                              <button onClick={() => deleteItem('education', edu.id)} className="p-2 text-red-400 hover:bg-gray-50 rounded-lg">
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Clients */}
                <div>
                  <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center gap-3">
                      <SettingsIcon size={20} className="text-primary" />
                      <h3 className="text-xl font-bold">Clients / Partners</h3>
                    </div>
                    <button onClick={() => setEditingItem({ col: 'clients', item: {} })} className="p-2 bg-primary text-white rounded-xl">
                      <Plus size={18} />
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {clients.map(c => (
                      <div key={c.id} className="p-4 bg-gray-50 rounded-2xl flex items-center gap-4 group">
                        <div className="w-10 h-10 rounded-lg bg-gray-200 overflow-hidden"><img src={c.image} alt="" className="w-full h-full object-cover" /></div>
                        <span className="font-bold text-gray-700 flex-1 truncate">{c.name || 'Unnamed Client'}</span>
                        <div className="flex items-center gap-2">
                          <button onClick={() => setEditingItem({ col: 'clients', item: c })} className="p-2 text-primary hover:bg-white rounded-lg transition-colors">
                            <Edit3 size={16} />
                          </button>
                          <button onClick={() => deleteItem('clients', c.id)} className="p-2 text-red-400 hover:bg-white rounded-lg transition-colors">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'global' && (
              <div className="space-y-8">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-gray-50 text-gray-600 rounded-2xl">
                    <SettingsIcon size={24} />
                  </div>
                  <h2 className="text-2xl font-black text-gray-900">Global Settings</h2>
                </div>

                <div className="grid grid-cols-1 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Footer Copyright Text</label>
                    <input 
                      value={siteSettings.footerRights}
                      onChange={e => setSiteSettings({...siteSettings, footerRights: e.target.value})}
                      className="w-full px-5 py-4 bg-gray-50 rounded-2xl border-none font-bold text-gray-800 focus:ring-2 focus:ring-primary/20 transition-all"
                      placeholder="© 2026. All rights reserved."
                    />
                  </div>
                </div>

                {/* GST Slab Management Panel */}
                <div className="bg-white dark:bg-gray-950 rounded-[2rem] border border-gray-100 dark:border-gray-800 p-6 space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 dark:border-gray-800 pb-4">
                    <div>
                      <h3 className="text-lg font-black text-gray-900 dark:text-white">GST Slab Rates & Configurations</h3>
                      <p className="text-xs text-gray-400 font-medium">Define tax codes that dynamically calculate in the Hospital Billing module.</p>
                    </div>
                    <button
                      type="button"
                      onClick={handleResetGstSlabs}
                      className="text-[10px] font-black uppercase tracking-wider py-2 px-4 bg-gray-150 hover:bg-gray-200 dark:bg-gray-850 dark:hover:bg-gray-750 text-gray-600 dark:text-gray-300 rounded-xl transition-all"
                    >
                      Reset to defaults
                    </button>
                  </div>

                  {/* Active GST Slabs list */}
                  <div className="space-y-2">
                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest block mb-2">Active GST Slabs</label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {(siteSettings.gstSlabs || []).map((slab: any, idx: number) => (
                        <div key={idx} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-850 group">
                          <div>
                            <span className="inline-block px-2.5 py-1 bg-primary/10 text-primary rounded-xl text-[10px] font-extrabold font-mono mb-1">
                              {slab.rate}%
                            </span>
                            <span className="block text-xs font-bold text-gray-700 dark:text-gray-300 truncate max-w-[150px]">
                              {slab.label.replace(/^\d+%\s*/, '') || slab.label}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleDeleteGstSlab(idx)}
                            className="p-2 text-gray-400 hover:text-red-500 rounded-xl hover:bg-white dark:hover:bg-gray-800 transition-colors opacity-1 sm:opacity-0 group-hover:opacity-100"
                            title="Remove Tax Slab"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      ))}
                    </div>
                    {(siteSettings.gstSlabs || []).length === 0 && (
                      <p className="text-xs italic text-gray-400 py-2">No active slabs configured. Please add one below.</p>
                    )}
                  </div>

                  {/* Add New Slab Form */}
                  <div className="bg-gray-50/50 dark:bg-gray-900/40 p-5 rounded-2xl border border-dashed border-gray-200 dark:border-gray-800 space-y-4">
                    <h4 className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-widest">Create New Tax Slab</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="text-[10px] text-gray-400 uppercase font-black block mb-1">Rate (%)</label>
                        <input
                          type="number"
                          placeholder="e.g. 18"
                          value={newSlabRate}
                          onChange={(e) => setNewSlabRate(e.target.value)}
                          className="w-full px-4 py-3 bg-white dark:bg-gray-900 text-gray-900 dark:text-white rounded-xl border border-gray-100 dark:border-gray-700 text-xs font-bold outline-none focus:ring-2 focus:ring-primary/20"
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="text-[10px] text-gray-400 uppercase font-black block mb-1">Slab Description</label>
                        <input
                          type="text"
                          placeholder="e.g. ICU Surcharge"
                          value={newSlabLabel}
                          onChange={(e) => setNewSlabLabel(e.target.value)}
                          className="w-full px-4 py-3 bg-white dark:bg-gray-900 text-gray-900 dark:text-white rounded-xl border border-gray-100 dark:border-gray-700 text-xs font-bold outline-none focus:ring-2 focus:ring-primary/20"
                        />
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleAddGstSlab}
                      className="w-full py-3 bg-primary text-white font-extrabold text-[10px] uppercase tracking-widest rounded-xl hover:opacity-95 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                    >
                      <Plus size={14} /> Add Slab Node
                    </button>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {status && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className={`fixed bottom-8 right-8 px-8 py-4 rounded-3xl shadow-2xl font-bold text-white z-[200] ${status.type === 'success' ? 'bg-green-600' : 'bg-red-600'}`}
        >
          {status.msg}
        </motion.div>
      )}
    </div>
  );
};

