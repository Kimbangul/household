# Expo HAS CHANGED

Read the exact versioned docs at https://docs.expo.dev/versions/v57.0.0/ before writing any code.

## 프로젝트 개요

스프레드시트로 관리하던 개인 가계부를 대체하는 Expo(React Native) 앱. 서버·DB 없이 기기 로컬에만 데이터를 저장하는 개인용 단일 사용자 앱이다.

핵심 화면: 메인 / 기간별 지출 / 지출내역 추가 / 설정.

도메인 용어(지출내역, 기간, 기간외 지출, 카테고리, 미분류, 수입, 순저축 등)는 `CONTEXT.md`를 따른다. 일반적인 가계부 앱과 다른 핵심 결정(기간은 지출 날짜로 자동 매핑되고 서로 겹칠 수 있음, 서버 동기화 없이 로컬 전용 저장)은 `docs/adr/`에 기록되어 있으니 관련 작업 전에 반드시 확인할 것.

## Agent skills

### Issue tracker

Issues live in GitHub Issues (via the `gh` CLI). See `docs/agents/issue-tracker.md`.

### Domain docs

Single-context layout (`CONTEXT.md` + `docs/adr/` at repo root). See `docs/agents/domain.md`.
