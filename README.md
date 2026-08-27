# 가계부

스프레드시트로 관리하던 개인 가계부를 대체하는 앱입니다. 서버나 계정 동기화 없이 기기 로컬에만 데이터를 저장하는 개인용 단일 사용자 앱입니다 (자세한 배경은 [`docs/adr/0002-로컬-전용-저장.md`](docs/adr/0002-로컬-전용-저장.md) 참고).

지출내역 입력, 원하는 날짜 범위로 자유롭게 만드는 "기간" 단위 집계, 카테고리별 통계, 다크 모드 등을 지원합니다.

## 실행 방법

### 사전 준비

- [Node.js](https://nodejs.org/) 22.13 이상 (Expo SDK 57 최소 요구 버전)
- 실제 기기에서 확인하려면 [Expo Go](https://expo.dev/go) 앱 (iOS/Android)

### 설치

```sh
npm install
```

### 개발 서버 실행

```sh
npm start
```

터미널에 뜨는 QR 코드를 Expo Go 앱으로 스캔하면 바로 실행됩니다. 또는 개발 서버가 켜진 상태에서 터미널에서 `a`(Android), `i`(iOS), `w`(Web) 키를 눌러도 됩니다.

특정 플랫폼으로 바로 실행하려면:

```sh
npm run web       # 웹 브라우저
npm run ios       # iOS 시뮬레이터 (macOS + Xcode 필요)
npm run android   # Android 에뮬레이터 (Android Studio 필요)
```

## 테스트 실행

```sh
npm test
```

## 더 알아보기

- [`CONTEXT.md`](CONTEXT.md) — 도메인 용어집 (지출내역, 기간, 미분류 등)
- [`AGENTS.md`](AGENTS.md) — 프로젝트 개요 및 개발 규칙
- [`docs/adr/`](docs/adr/) — 아키텍처 결정 기록
