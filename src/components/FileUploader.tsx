import { toast } from 'sonner';

interface FileWithUrl extends File {
    url: string;
}

const handleFileUpload = async (files: FileWithUrl[]) => {
    try {
        // Show loading state
        toast.loading('Processing files in batches...');
        
        const response = await fetch('/api/analyst/openaisearch', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                urls: files.map(file => file.url)
            })
        });

        if (!response.ok) {
            throw new Error('Failed to process files');
        }

        const { results } = await response.json();
        
        // Clear loading state and show success
        toast.dismiss();
        toast.success(`Successfully processed ${results.length} files`);
        
        return results;
    } catch (error: unknown) {
        toast.dismiss();
        toast.error('Error processing files: ' + (error instanceof Error ? error.message : 'Unknown error'));
        return [];
    }
}; 