import {
  callReadOnlyFunction,
  contractPrincipalCV,
  cvToString,
  cvToValue,
  intCV,
  makeContractCall,
  stringAsciiCV,
  tupleCV,
  uintCV,
  bufferCV,
  standardPrincipalCV,
  get.network,
  StacksTestnet,
  StacksMainnet,
  ClarityValue,
} from '@stacks/transactions';
import { StacksNetwork } from '@stacks/network';

export const CONTRACT_ADDRESS = 'STXXXXX...'; // E.g., 'ST2467F5D1...YOURCONTRACTADDRESS'
export const CONTRACT_NAME = 'safe-traffic-ledger';


export const NETWORK = new StacksTestnet();

export const CLARITY_CONSTANTS = {
  PENDING: 0,
  REVEALED: 1,
  DISPUTED: 2,
  RESOLVED: 3,
  STALE: 4,
};

export function commitIncident(
  evidenceHash: string,
  metaHash: string,
  geoHash: string,
  type: number,
  senderAddress: string,
) {

  const evidenceBuff = bufferCV(Buffer.from(evidenceHash.slice(2), 'hex'));
  const metaBuff = bufferCV(Buffer.from(metaHash.slice(2), 'hex'));
  const geoBuff = bufferCV(Buffer.from(geoHash.slice(2), 'hex'));
  const typeCV = uintCV(type);

  return makeContractCall({
    contractAddress: CONTRACT_ADDRESS,
    contractName: CONTRACT_NAME,
    functionName: 'commit-incident',
    functionArgs: [evidenceBuff, metaBuff, geoBuff, typeCV],
    network: NETWORK,
    appDetails: { name: 'SafeTraffic Ledger', icon: '/logo.png' }, 
    postConditionMode: 1,
    stxAddress: senderAddress,
  });
}

export function revealIncident(
  id: number,
  cid: string,
  metaHashCheck: string,
  salt: string,
  evidenceHashCheck: string,
  senderAddress: string,
) {
  return makeContractCall({
    contractAddress: CONTRACT_ADDRESS,
    contractName: CONTRACT_NAME,
    functionName: 'reveal-incident',
    functionArgs: [
        uintCV(id),
        stringAsciiCV(cid),
        bufferCV(Buffer.from(metaHashCheck.slice(2), 'hex')),
        bufferCV(Buffer.from(salt.slice(2), 'hex')),
        bufferCV(Buffer.from(evidenceHashCheck.slice(2), 'hex')),
    ],
    network: NETWORK,
    appDetails: { name: 'SafeTraffic Ledger', icon: '/logo.png' },
    postConditionMode: 1,
    stxAddress: senderAddress,
  });
}

export function openDispute(
  id: number,
  reasonHash: string,
) {
  return makeContractCall({
    contractAddress: CONTRACT_ADDRESS,
    contractName: CONTRACT_NAME,
    functionName: 'open-dispute',
    functionArgs: [
        uintCV(id),
        bufferCV(Buffer.from(reasonHash.slice(2), 'hex')),
    ],
    network: NETWORK,
    appDetails: { name: 'SafeTraffic Ledger', icon: '/logo.png' },
    postConditionMode: 1,
    stxAddress: 'ST000000000000000000002AMW4Q8',
  });
}

export function resolveDispute(
    id: number,
    newStatus: number, 
    senderAddress: string,
) {
    return makeContractCall({
        contractAddress: CONTRACT_ADDRESS,
        contractName: CONTRACT_NAME,
        functionName: 'resolve-dispute',
        functionArgs: [
            uintCV(id),
            uintCV(newStatus),
        ],
        network: NETWORK,
        appDetails: { name: 'SafeTraffic Ledger', icon: '/logo.png' },
        postConditionMode: 1,
        stxAddress: senderAddress,
    });
}

export async function getIncidentData(id: number) {
  try {
    const result = await callReadOnlyFunction({
        contractAddress: CONTRACT_ADDRESS,
        contractName: CONTRACT_NAME,
        functionName: 'get-incident-by-id',
        functionArgs: [uintCV(id)],
        senderAddress: 'ST000000000000000000002AMW4Q8',
        network: NETWORK,
    });

    const tupleResult = cvToValue(result) as any;
    if (!tupleResult || tupleResult.type !== 'ResponseOk') {
        return null; 
    }

    // Mapear los campos de Clarity a un objeto JS
    const data = tupleResult.value;
    
    return {
        id: id.toString().padStart(4, '0'), // Genera el formato '0001'
        proposer: data['proposer'].value,
        evidenceHash: `0x${data['evidence-hash'].buffer.toString('hex')}`,
        metaHash: `0x${data['meta-hash'].buffer.toString('hex')}`,
        geoHash: `0x${data['geo-hash'].buffer.toString('hex')}`,
        status: Number(data['status'].value),
        commitHeight: Number(data['commit-height'].value),
        reveralCid: data['reveral-cid'].data,
    };
  } catch (e) {
    // console.error(`Error fetching incident ${id}:`, e);
    return null;
  }
}
export async function getIncidentCounter() {
    try {
        const result = await callReadOnlyFunction({
            contractAddress: CONTRACT_ADDRESS,
            contractName: CONTRACT_NAME,
            functionName: 'incident-id-counter', 
            functionArgs: [],
            // Dirección de un remitente cualquiera para la llamada de sólo lectura
            senderAddress: 'ST000000000000000000002AMW4Q8',
            network: NETWORK,
        });
        const value = cvToValue(result) as bigint;
        // Retorna el ID del último incidente (contador - 1)
        return Number(value > 0n ? value - 1n : 0n);
    } catch (e) {
        console.error("Error fetching incident counter:", e);
        return 0;
    }
}
