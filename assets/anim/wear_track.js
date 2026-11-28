/* v2.12 — «아이템 따라붙이기 위치 자료»(B안용). 형식·넣는 법 = docs/WEAR_POSE_TRACK.md
   지금은 0개 → 아이템을 입으면 모든 포즈가 A안 공통 움직임으로 나온다(charanim.js poseMode).
   WEAR_TRACK[캐릭터][컷][포즈 이름] = { v:1, n:장면 수, ms:[장면별 시간], f:[장면마다 { head, neck, wristL, wristR, waist, footL, footR, body }] } */
window.WEAR_TRACK = {};
