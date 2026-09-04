import React, { useEffect, useState } from 'react';
import { campaignService } from '../services/campaignService';
import { Campaign } from '../types';
import { useAppContext } from '../store/AppContext';
import CampaignModal from '../components/campaign/CampaignModal';
import ConfirmDialog from '../components/common/ConfirmDialog';

const CampaignSelector: React.FC = () => {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<Campaign | undefined>(undefined);
  const [campaignToDelete, setCampaignToDelete] = useState<string | null>(null);
  
  const { setActiveCampaign } = useAppContext();

  useEffect(() => {
    loadCampaigns();
  }, []);

  const loadCampaigns = async () => {
    try {
      const allCampaigns = await campaignService.getAll();
      setCampaigns(allCampaigns);
    } catch (error) {
      console.error('Failed to load campaigns:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCampaign = () => {
    setEditingCampaign(undefined);
    setIsModalOpen(true);
  };

  const handleEditCampaign = (campaign: Campaign) => {
    setEditingCampaign(campaign);
    setIsModalOpen(true);
  };

  const handleSaveCampaign = async (data: { name: string; gameSystem: string }) => {
    try {
      if (editingCampaign) {
        await campaignService.update(editingCampaign.id, data.name, data.gameSystem);
      } else {
        await campaignService.create({
          id: crypto.randomUUID(),
          name: data.name,
          gameSystem: data.gameSystem
        });
      }
      loadCampaigns();
    } catch (error) {
      alert('Failed to save campaign');
    }
  };

  const handleDeleteCampaign = async (id: string) => {
    setCampaignToDelete(id);
  };

  const confirmDelete = async () => {
    if (campaignToDelete) {
      try {
        await campaignService.delete(campaignToDelete);
        loadCampaigns();
      } catch (error) {
        alert('Failed to delete campaign');
      } finally {
        setCampaignToDelete(null);
      }
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-3xl font-bold text-theme-text">Select Campaign</h2>
          <p className="text-theme-text-muted mt-1">Choose a campaign to manage or create a new one.</p>
        </div>
        <button 
          onClick={handleCreateCampaign}
          className="bg-theme-primary hover:bg-theme-primary-hover text-theme-primary-text px-6 py-2 rounded-lg text-sm font-semibold transition-all shadow-lg shadow-black/20"
        >
          + New Campaign
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-theme-primary"></div>
        </div>
      ) : campaigns.length === 0 ? (
        <div className="text-center py-20 bg-theme-bg-alt/50 rounded-xl border-2 border-theme-border border-dashed">
          <p className="text-theme-text-muted text-lg mb-6">No campaigns found.</p>
          <button 
            onClick={handleCreateCampaign}
            className="bg-theme-bg-alt hover:bg-theme-bg px-6 py-2 rounded-lg text-sm font-semibold transition-all border border-theme-border text-theme-text"
          >
            Create your first campaign
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {campaigns.map((campaign) => (
            <div 
              key={campaign.id} 
              className="group bg-theme-bg-alt border border-theme-border rounded-xl p-6 hover:border-theme-primary/50 hover:bg-theme-bg transition-all cursor-pointer shadow-lg"
              onClick={() => setActiveCampaign(campaign)}
            >
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-bold group-hover:text-theme-primary transition-colors text-theme-text">{campaign.name}</h3>
                <span className="bg-theme-bg text-xs px-2 py-1 rounded text-theme-text-muted font-medium border border-theme-border">
                  {campaign.gameSystem}
                </span>
              </div>
              
              <div className="flex items-center text-xs text-theme-text-muted space-x-4 mb-6">
                <span>Created: {new Date(campaign.createdAt).toLocaleDateString()}</span>
              </div>

              <div className="flex justify-end space-x-3 opacity-0 group-hover:opacity-100 transition-opacity">
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEditCampaign(campaign);
                  }}
                  className="text-sm text-theme-text-muted hover:text-theme-text transition-colors"
                >
                  Edit
                </button>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteCampaign(campaign.id);
                  }}
                  className="text-sm text-red-500 hover:text-red-400 transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <CampaignModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveCampaign}
        initialData={editingCampaign}
        title={editingCampaign ? 'Edit Campaign' : 'Create New Campaign'}
      />

      <ConfirmDialog
        isOpen={campaignToDelete !== null}
        title="Delete Campaign"
        message="Are you sure you want to delete this campaign? This action cannot be undone."
        onConfirm={confirmDelete}
        onCancel={() => setCampaignToDelete(null)}
      />
    </div>
  );
};

export default CampaignSelector;
