"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AbstractShape from '@/components/abstract-shape';
import { supabase } from '@/lib/supabase/supabaseClient';

interface ProfileEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  walletAddress: string;
  currentUsername: string;
  currentAvatarUrl?: string;
  onProfileUpdate: (profileData: {
    username: string;
    avatar_url?: string;
  }) => void;
}

export default function ProfileEditModal({
  isOpen,
  onClose,
  walletAddress,
  currentUsername,
  currentAvatarUrl,
  onProfileUpdate
}: ProfileEditModalProps) {
  const [username, setUsername] = useState(currentUsername);
  const [avatarUrl, setAvatarUrl] = useState(currentAvatarUrl);
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentAvatarUrl || null);
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      // Reset form state when modal opens
      setUsername(currentUsername);
      setAvatarUrl(currentAvatarUrl);
      setPreviewUrl(currentAvatarUrl || null);
      setSelectedFile(null);
      setError(null);
    }
  }, [isOpen, currentUsername, currentAvatarUrl]);

  const getPublicUrl = (path: string): string => {
    const { data } = supabase.storage
      .from('profile-images')
      .getPublicUrl(path);
    return data.publicUrl;
  };

  const uploadImageToSupabase = async (file: File): Promise<string | null> => {
    try {
      // Create a unique file path using wallet address and timestamp
      const fileExt = file.name.split('.').pop();
      const fileName = `${walletAddress}_${Date.now()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;
  
      console.log("Attempting to upload to path:", filePath);
  
      // Upload the file to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('profile-images')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        });
  
      if (uploadError) {
        console.error('Error uploading to Supabase:', uploadError);
        throw new Error(uploadError.message);
      }
  
      // Get the full public URL for the image
      const publicUrl = getPublicUrl(filePath);
      console.log('File uploaded successfully, URL:', publicUrl);
      
      // Immediately verify the URL is accessible
      try {
        const response = await fetch(publicUrl, { method: 'HEAD' });
        if (!response.ok) {
          console.warn('Uploaded file URL check failed:', response.status);
        } else {
          console.log('URL is valid and accessible');
        }
      } catch (err) {
        console.warn('Error checking URL:', err);
      }
  
      return publicUrl;
    } catch (error) {
      console.error('Error in uploadImageToSupabase:', error);
      return null;
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file.');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('File size should be less than 5MB.');
      return;
    }

    try {
      setIsUploading(true);
      setError(null);
      setSelectedFile(file);
      
      // Create a local object URL for preview
      const objectUrl = URL.createObjectURL(file);
      setPreviewUrl(objectUrl);
      
      // We'll upload to Supabase when the user clicks Save
      setIsUploading(false);
    } catch (err) {
      console.error('Preview error:', err);
      setError('Failed to preview the image.');
      setIsUploading(false);
    }
  };

  const handleSave = async () => {
    if (!username.trim()) {
      setError('Username is required.');
      return;
    }
  
    try {
      setIsSaving(true);
      setError(null);
  
      let finalAvatarUrl = avatarUrl;
      
      // If a new file was selected, upload it to Supabase
      if (selectedFile) {
        const uploadedUrl = await uploadImageToSupabase(selectedFile);
        if (uploadedUrl) {
          finalAvatarUrl = uploadedUrl;
          
          // Force refresh the image by adding a timestamp query param
          finalAvatarUrl = `${uploadedUrl}?t=${Date.now()}`;
          
          console.log("Final avatar URL with cache busting:", finalAvatarUrl);
        } else {
          setError('Failed to upload image to storage.');
          setIsSaving(false);
          return;
        }
      }
  
      // Update the profile with the new data
      onProfileUpdate({
        username: username.trim(),
        avatar_url: finalAvatarUrl
      });
      
      onClose();
    } catch (err) {
      console.error('Save error:', err);
      setError('An unexpected error occurred while saving your profile.');
    } finally {
      setIsSaving(false);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-black border-2 border-purple-500 text-white p-6 max-w-md w-full font-pixel">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-white mb-4">EDIT PROFILE</DialogTitle>
        </DialogHeader>
        
        <div className="mb-8">
          {/* Avatar upload */}
          <div className="flex flex-col items-center mb-6">
            <div 
              className="w-24 h-24 relative overflow-hidden mb-4 cursor-pointer rounded-full"
              onClick={triggerFileInput}
            >
              {previewUrl ? (
                <img 
                  src={previewUrl} 
                  alt="Avatar preview" 
                  className="w-full h-full object-cover"
                />
              ) : (
                <AbstractShape
                  className="w-full h-full text-purple-500"
                  type="complex"
                  animate
                />
              )}
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="text-white"
                >
                  <path
                    d="M9 16h6v-6h4l-7-7-7 7h4v6zm-4 2h14v2H5v-2z"
                    fill="currentColor"
                  />
                </svg>
              </div>
            </div>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*"
              className="hidden"
            />
            <Button
              type="button"
              onClick={triggerFileInput}
              className="bg-transparent border border-purple-500 hover:bg-purple-900/30 text-purple-400 rounded-none px-4 py-2 text-sm font-pixel"
              disabled={isUploading}
            >
              {isUploading ? 'UPLOADING...' : 'CHANGE AVATAR'}
            </Button>
          </div>

          {/* Username input */}
          <div className="mb-4">
            <Label htmlFor="username" className="block text-gray-400 mb-2">USERNAME</Label>
            <Input
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="bg-black border-2 border-purple-900 focus:border-purple-500 rounded-none p-3 text-white font-pixel w-full"
            />
          </div>

          {/* Error message */}
          {error && (
            <div className="text-red-500 text-sm mb-4">
              {error}
            </div>
          )}
        </div>

        <DialogFooter className="flex space-x-4">
          <Button
            type="button"
            onClick={onClose}
            className="bg-transparent border-2 border-pink-500 hover:bg-pink-950/30 text-white rounded-none px-4 py-2 font-pixel tracking-wide flex-1"
          >
            CANCEL
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="bg-transparent border-2 border-purple-500 hover:bg-purple-950/30 text-white rounded-none px-4 py-2 font-pixel tracking-wide flex-1"
          >
            {isSaving ? 'SAVING...' : 'SAVE CHANGES'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}