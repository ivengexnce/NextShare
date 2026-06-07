// useOffline.js should look like:
import { useEffect, useCallback } from 'react';
import useStore from '../../store/useStore';
import { offlineDB } from '../../store/offlineDB';
import { urlApi } from '../../features/url/url.api';
import { textApi } from '../../features/text/text.api';

/**
 * useOffline— registers online / offline listeners and handles background sync.*
 * @returns {void}
 */
export function useOffline() {
    const { setOnline, addToast } = useStore();

    const syncPending = useCallback(async() => {
        // Flush queued URL shortenings
        const pendingUrls = await offlineDB.getPendingUrls();
        for (const item of pendingUrls) {
            try {
                await urlApi.shorten({ originalUrl: item.originalUrl, title: item.title });
                await offlineDB.clearPendingUrl(item.id);
            } catch {
                // Don't fail-fast: try remaining items
            }
        }

        // Flush queued pastes
        const pendingPastes = await offlineDB.getPendingPastes();
        for (const item of pendingPastes) {
            try {
                await textApi.create(item);
                await offlineDB.clearPendingPaste(item.id);
            } catch {
                // Same pattern
            }
        }

        if (pendingUrls.length + pendingPastes.length > 0) {
            addToast(`Synced ${pendingUrls.length + pendingPastes.length} queued item(s)`, 'success');
        }
    }, [addToast]);

    useEffect(() => {
        const handleOnline = () => {
            setOnline(true);
            addToast('Back online — syncing queued items…', 'info');
            syncPending();
        };
        const handleOffline = () => {
            setOnline(false);
            addToast('You are offline — items will sync when reconnected', 'warning');
        };

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, [setOnline, addToast, syncPending]);
}