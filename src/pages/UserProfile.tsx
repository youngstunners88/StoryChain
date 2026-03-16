import React, { useState, useEffect } from 'react';
import { useParams } from '../utils/useParams';
import { User, BookOpen, Heart, Users, Calendar, TrendingUp, ArrowLeft, Check, Plus } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import type { Story, LLMModel } from '../types';

interface UserProfileData {
  id: string;
  username: string;
  createdAt: string;
  storiesCount: number;
  contributionsCount: number;
  totalLikes: number;
  followersCount: number;
  followingCount: number;
  isFollowing: boolean;
  isCurrentUser: boolean;
}

interface UserStory extends Story {
  likeCount: number;
  contributionCount: number;
}

export const UserProfile: React.FC = () => {
  const { id } = useParams();
  const { fetchWithAuth } = useAuth();
  const [profile, setProfile] = useState<UserProfileData | null>(null);
  const [stories, setStories] = useState<UserStory[]>([]);
  const [activeTab, setActiveTab] = useState<'stories' | 'contributions' | 'likes'>('stories');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) fetchProfile();
  }, [id]);

  useEffect(() => {
    if (profile && activeTab) fetchTabData();
  }, [activeTab, profile]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const response = await fetchWithAuth(`/api/users/${id}`);
      if (!response.ok) throw new Error('Failed to fetch profile');
      
      const data = await response.json();
      setProfile(data.user);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const fetchTabData = async () => {
    if (!profile) return;
    
    try {
      const endpoint = activeTab === 'stories' 
        ? `/api/users/${profile.id}/stories`
        : activeTab === 'contributions'
          ? `/api/users/${profile.id}/contributions`
          : `/api/users/${profile.id}/liked`;
          
      const response = await fetchWithAuth(endpoint);
      if (!response.ok) throw new Error(`Failed to fetch ${activeTab}`);
      
      const data = await response.json();
      setStories(data.stories || []);
    } catch (err) {
      console.error(`Failed to fetch ${activeTab}:`, err);
    }
  };

  const handleFollow = async () => {
    if (!profile || profile.isCurrentUser) return;
    
    try {
      const response = await fetchWithAuth(`/api/users/${profile.id}/follow`, {
        method: 'POST',
        body: JSON.stringify({}),
      });
      
      if (response.ok) {
        const data = await response.json();
        setProfile(prev => prev ? { ...prev, isFollowing: data.following, followersCount: data.followersCount } : null);
      }
    } catch (error) {
      console.error('Failed to follow user:', error);
    }
  };

  const formatDate = (date: string): string => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
    });
  };

  const getModelColor = (model: LLMModel): string => {
    const colors: Record<LLMModel, string> = {
      'kimi-k2.5': 'bg-purple-500/20 text-purple-400',
      'reka-edge': 'bg-blue-500/20 text-blue-400',
      'qwen-2.5': 'bg-cyan-500/20 text-cyan-400',
      'mercury-2': 'bg-amber-500/20 text-amber-400',
      'llama-3.1': 'bg-green-500/20 text-green-400',
      'gemma-2': 'bg-pink-500/20 text-pink-400',
      'mixtral-8x7b': 'bg-orange-500/20 text-orange-400',
      'gemini-pro': 'bg-indigo-500/20 text-indigo-400',
    };
    return colors[model] || 'bg-zinc-500/20 text-zinc-400';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-2 border-amber-500 border-t-transparent"></div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-zinc-950 py-8 px-4">
        <div className="max-w-3xl mx-auto">
          <div className="p-8 bg-red-500/10 border border-red-500/30 rounded-xl text-center">
            <h2 className="text-xl font-semibold text-red-400">{error || 'User not found'}</h2>
            <a href="/feed" className="mt-4 inline-block text-amber-500 hover:text-amber-400">
              Back to Feed
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 py-8 px-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Back Button */}
        <a
          href="/feed"
          className="inline-flex items-center gap-2 text-zinc-500 hover:text-zinc-300 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Feed
        </a>

        {/* Profile Header */}
        <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row sm:items-start gap-6">
            {/* Avatar */}
            <div className="w-24 h-24 bg-gradient-to-br from-amber-500 via-orange-500 to-red-500 rounded-2xl flex items-center justify-center flex-shrink-0">
              <span className="text-4xl font-bold text-white">
                {profile.username.charAt(0).toUpperCase()}
              </span>
            </div>

            {/* Info */}
            <div className="flex-1">
              <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-4">
                <h1 className="text-2xl sm:text-3xl font-bold text-zinc-100">{profile.username}</h1>
                
                {!profile.isCurrentUser && (
                  <button
                    onClick={handleFollow}
                    className={`
                      flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors
                      ${profile.isFollowing
                        ? 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                        : 'bg-amber-500 hover:bg-amber-400 text-black'
                      }
                    `}
                  >
                    {profile.isFollowing ? (
                      <>
                        <Check className="w-4 h-4" />
                        Following
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4" />
                        Follow
                      </>
                    )}
                  </button>
                )}
              </div>

              <div className="flex flex-wrap gap-4 text-sm text-zinc-500 mb-6">
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4" />
                  Joined {formatDate(profile.createdAt)}
                </span>
                <span className="flex items-center gap-1.5">
                  <Users className="w-4 h-4" />
                  {profile.followersCount} followers
                </span>
                <span className="flex items-center gap-1.5">
                  <User className="w-4 h-4" />
                  {profile.followingCount} following
                </span>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-zinc-950 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-zinc-100">{profile.storiesCount}</div>
                  <div className="text-xs text-zinc-500">Stories</div>
                </div>
                <div className="bg-zinc-950 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-zinc-100">{profile.contributionsCount}</div>
                  <div className="text-xs text-zinc-500">Contributions</div>
                </div>
                <div className="bg-zinc-950 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-zinc-100">{profile.totalLikes}</div>
                  <div className="text-xs text-zinc-500">Total Likes</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 border-b border-zinc-800">
          {[
            { id: 'stories', label: 'Stories', icon: BookOpen, count: profile.storiesCount },
            { id: 'contributions', label: 'Contributions', icon: TrendingUp, count: profile.contributionsCount },
            { id: 'likes', label: 'Liked', icon: Heart, count: 0 },
          ].map(({ id, label, icon: Icon, count }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id as typeof activeTab)}
              className={`
                flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors border-b-2
                ${activeTab === id
                  ? 'text-amber-400 border-amber-400'
                  : 'text-zinc-500 border-transparent hover:text-zinc-300'
                }
              `}
            >
              <Icon className="w-4 h-4" />
              {label}
              <span className="px-1.5 py-0.5 bg-zinc-800 rounded text-xs">{count}</span>
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="space-y-4">
          {stories.length === 0 ? (
            <div className="text-center py-16">
              <BookOpen className="w-16 h-16 text-zinc-700 mx-auto mb-4" />
              <h3 className="text-xl font-medium text-zinc-400">No {activeTab} yet</h3>
              <p className="text-zinc-500 mt-2">
                {activeTab === 'stories' 
                  ? `${profile.isCurrentUser ? 'You haven\'t' : 'This user hasn\'t'} created any stories yet`
                  : activeTab === 'contributions'
                    ? `${profile.isCurrentUser ? 'You haven\'t' : 'This user hasn\'t'} made any contributions yet`
                    : 'No liked stories yet'
                }
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {stories.map((story) => (
                <a
                  key={story.id}
                  href={`/story/${story.id}`}
                  className="group bg-zinc-900 rounded-xl border border-zinc-800 p-5 hover:border-amber-500/30 transition-all"
                >
                  <div className="flex items-start justify-between mb-3">
                    <span className={`px-2 py-0.5 text-[10px] font-medium rounded ${getModelColor(story.modelUsed)}`}>
                      {story.modelUsed}
                    </span>
                    <span className="text-xs text-zinc-500">
                      {new Date(story.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  <h3 className="text-lg font-semibold text-zinc-100 mb-2 group-hover:text-amber-400 transition-colors line-clamp-2">
                    {story.title}
                  </h3>

                  <p className="text-sm text-zinc-500 mb-4 line-clamp-2">
                    {story.content.substring(0, 120)}...
                  </p>

                  <div className="flex items-center gap-4 text-xs text-zinc-500">
                    <span className="flex items-center gap-1">
                      <Heart className="w-3.5 h-3.5" />
                      {story.likeCount || 0}
                    </span>
                    <span className="flex items-center gap-1">
                      <TrendingUp className="w-3.5 h-3.5" />
                      {story.contributionCount || 0} contributions
                    </span>
                  </div>
                </a>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserProfile;