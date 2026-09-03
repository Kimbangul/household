# iOS 빌드는 EAS Build(클라우드) + 유료 Apple Developer Program으로 진행한다

이 앱을 본인 소유 아이폰 1대에 설치해 쓸 독립 실행형(Expo Go 아님) iOS 앱으로 만들기로 했다. 개발 환경이 Windows이고 Mac을 구할 방법이 없으므로, EAS Build로 클라우드에서 iOS를 빌드하고 유료 Apple Developer Program($99/년)으로 서명한다. iOS 컴파일·코드사이닝은 macOS 툴체인(Xcode) 전용이라 이 제약은 React Native를 바닐라로 썼어도 동일했을 것이며, 무료 Apple ID의 로컬 "Personal Team" 서명은 7일마다 만료돼 Mac에 주기적으로 연결해야 하므로 채택하지 않았다. 배포는 App Store Connect 앱 등록이 필요 없는 EAS Internal(Ad Hoc) Distribution을 쓰고, TestFlight·App Store 공개 배포는 사용자가 본인 한 명뿐이라 채택하지 않았다. 네이티브 변경이 없는 JS/UI 수정은 EAS Update(OTA)로 배포해 EAS Build 무료 티어의 빌드 횟수를 아끼고, 네이티브 설정(권한·플러그인·아이콘 등)이 바뀔 때만 EAS Build를 새로 돌린다.

## Considered Options

- **Expo Go로 실행** — 커스텀 네이티브 코드가 없어 기술적으로는 가능했으나, 홈 화면 독립 앱을 원해 채택하지 않음
- **Mac 확보 후 로컬 Xcode 빌드(무료 계정)** — Mac 접근 자체가 없고, 있어도 7일마다 재빌드/재설치해야 해 반복 빌드가 잦은 이 프로젝트엔 번거로움
- **TestFlight 배포** — 사용자 1명·기기 1대에는 App Store Connect 앱 등록이 불필요한 오버헤드

## Consequences

- Apple Developer Program 연 $99 비용이 매년 발생한다
- iOS bundle identifier는 `com.yerime.householdledger`로 고정한다
- Ad Hoc 배포이므로 아이폰의 UDID를 최초 1회 등록해야 한다
- 나중에 다른 사람과 공유하거나 App Store 공개가 필요해지면 이 ADR을 다시 열어 TestFlight/App Store 배포로 재검토한다
