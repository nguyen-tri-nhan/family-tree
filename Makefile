FRONTEND := frontend
PKG      := $(FRONTEND)/packages

.PHONY: install build build-lib build-web build-electron \
        dev dev-web dev-electron \
        typecheck typecheck-web typecheck-electron \
        clean

# ── Setup ──────────────────────────────────────────────────────────

install:
	cd $(FRONTEND) && npm install

# ── Build ──────────────────────────────────────────────────────────

build: build-lib build-web build-electron

build-lib:
	cd $(PKG)/tree-lib && npm run build

build-web: build-lib
	cd $(PKG)/web-app && npm run build

build-electron: build-lib
	cd $(PKG)/electron-app && npm run build

# ── Dev ────────────────────────────────────────────────────────────

dev: dev-web

dev-web:
	cd $(PKG)/web-app && npm run dev

dev-electron:
	cd $(PKG)/electron-app && npm run dev

# ── Typecheck ──────────────────────────────────────────────────────

typecheck: typecheck-web typecheck-electron
	cd $(PKG)/tree-lib && npm run typecheck

typecheck-web:
	cd $(PKG)/web-app && npm run typecheck

typecheck-electron:
	cd $(PKG)/electron-app && npm run typecheck

# ── Clean ──────────────────────────────────────────────────────────

clean:
	rm -rf $(PKG)/tree-lib/dist
	rm -rf $(PKG)/web-app/dist
	rm -rf $(PKG)/electron-app/out
