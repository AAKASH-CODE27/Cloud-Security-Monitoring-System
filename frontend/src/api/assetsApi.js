import * as assetApi from "./assetApi";

export const getAssets = assetApi.getAssets;
export const getAssetById = assetApi.getAssetById;
export const createAsset = assetApi.createAsset;
export const updateAsset = assetApi.updateAsset;
export const deleteAsset = assetApi.deleteAsset;
export const discoverAssets = assetApi.discoverAssets;
export const scanNetwork = assetApi.scanNetwork;
export const searchAssets = assetApi.searchAssets;

export default assetApi;