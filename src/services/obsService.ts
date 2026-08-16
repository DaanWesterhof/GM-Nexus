import { invoke } from "@tauri-apps/api/core";
import { Player, PlayerResource, StatusEffect } from "../types";
import { playerService } from "./playerService";

export interface OBSState {
  players: (Player & {
    resources: PlayerResource[];
    statusEffects: StatusEffect[];
  })[];
}

export const obsService = {
  async broadcastState(state: OBSState) {
    try {
      await invoke("broadcast_to_obs", {
        message: JSON.stringify({
          type: 'STATE_UPDATE',
          payload: state
        })
      });
    } catch (error) {
      console.warn("Failed to broadcast to OBS (this is expected if not running in Tauri):", error);
    }
  },

  async broadcastFullSync(campaignId: string) {
    const players = await playerService.getByCampaign(campaignId);
    const playersWithData = await Promise.all(
      players.map(async (p) => {
        const [resources, statusEffects] = await Promise.all([
          playerService.getResources(p.id),
          playerService.getStatusEffects(p.id)
        ]);
        return {
          ...p,
          resources,
          statusEffects
        };
      })
    );

    const state: OBSState = {
      players: playersWithData
    };

    try {
      await invoke("broadcast_to_obs", {
        message: JSON.stringify({
          type: 'FULL_SYNC',
          payload: state
        })
      });
    } catch (error) {
      console.warn("Failed to broadcast full sync to OBS (this is expected if not running in Tauri):", error);
    }
  }
};
