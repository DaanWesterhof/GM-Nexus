import React, { useEffect, useState } from 'react';
import { campaignService } from '../services/campaignService';
import { Campaign } from '../types';

const CampaignSelector: React.FC = () => {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);

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

  const handleCreateTestCampaign = async () => {
    const id = crypto.randomUUID();
    await campaignService.create({
      id,
      name: 'The Lost Kingdom',
      gameSystem: 'D&D'
    });
    loadCampaigns();
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Campaigns</h2>
        <button 
          onClick={handleCreateTestCampaign}
          className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded text-sm font-medium transition-colors"
        >
          + New Campaign
        </button>
      </div>

      {loading ? (
        <div className="text-center py-10">Loading campaigns...</div>
      ) : campaigns.length === 0 ? (
        <div className="text-center py-10 bg-gray-800 rounded-lg border border-gray-700 border-dashed">
          <p className="text-gray-400 mb-4">No campaigns found.</p>
          <button 
            onClick={handleCreateTestCampaign}
            className="text-blue-400 hover:text-blue-300 underline"
          >
            Create your first campaign
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {campaigns.map((campaign) => (
            <div key={campaign.id} className="bg-gray-800 border border-gray-700 rounded-lg p-6 hover:border-blue-500 transition-colors">
              <h3 className="text-xl font-semibold mb-2">{campaign.name}</h3>
              <p className="text-gray-400 text-sm mb-4">{campaign.gameSystem}</p>
              <div className="flex justify-end space-x-3">
                <button className="text-sm text-blue-400 hover:underline">Open</button>
                <button className="text-sm text-gray-400 hover:underline">Edit</button>
                <button 
                  onClick={async () => {
                    await campaignService.delete(campaign.id);
                    loadCampaigns();
                  }}
                  className="text-sm text-red-400 hover:underline"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CampaignSelector;
