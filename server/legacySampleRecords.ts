import crypto from 'node:crypto';
// Exact fingerprints of the retired seed records. Edited and custom records are preserved.
const fingerprints = new Set([
    "d7ce5f720ea39a0e05ff8526288072bdd7e5395f3351beef07786fbd4bd10b10",
    "9d53fa9029e578c13b3bc148c74efe7ba3d3f3c37d1682136115e3c35860f81e",
    "c658793256229f0474d2c9ad1d6b1bffbdc876faf193295c4a8232b4d501c57f",
    "b814fa390af5acc13cf2f07dd31cd187a28114606b9c2b11199850b46e6683af",
    "a46425c5a1c769f004a6259ed5e661f4160fbae86215b02726e453c7b3fd87f2",
    "93858039c21e1eb8a3879cae580d386c632fa385820728b8ba8856d95bb9d100",
    "4ebb5ef56571bc2f047af0fae9fff05529051880223e4e6dddef174949f33ad1",
    "d985b49bf70d703c1e0b110e233fad7f403d365a3b275e551e2bf369c5da90b6",
    "5da3c2939f65843a996474d371e3f0aa853c44f3322dfb940fc878474c2f73ac",
    "07038aec1c7532ce4d2d1d44f0bc5af2c35a0478cf9119c05aeb79d7d3552737",
    "62194cc5c7e1fccb4909e08710fcdac5da9b4d74df5025ec4f822efb21be0c97",
    "1070640ebde3f126da41a947f908f70582394ef7ce039c91ac01aafd8d60c89a",
    "5b2da860610e80b311ef1b2a2aa119033c94ebc8c40f275ffbc58d1427f8ed99",
    "9f7ea545e8da520f10f14d65d0fc85ddaaf084d2e97169adcb529d94cf77704a",
    "e00f47bea46f4f0680658dcaf619b163f71e3a0040e3fb0fbdd5d709b71a8198",
    "eee9eff91dc7e27035f705c4b44103ccf4d5b4b42f2059c87d98f056ed640ed6",
    "fa0f6e592d15bc172282c273cb44ce6a364201b2ee03e59c8cd7474376cc4e47"
]);
export function isLegacySampleRecord(row: Record<string, unknown>) {
    const stable = JSON.stringify(Object.fromEntries(Object.entries(row).filter(([key]) => !['id', 'updatedAt', 'createdAt'].includes(key)).sort(([a], [b]) => a.localeCompare(b))));
    return fingerprints.has(crypto.createHash('sha256').update(stable).digest('hex'));
}
