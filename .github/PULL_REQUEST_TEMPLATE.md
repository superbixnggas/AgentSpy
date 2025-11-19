# Pull Request

## 📝 Description
Provide a brief description of the changes in this PR.

## 🎯 Type of Change
- [ ] 🐛 Bug Fix (non-breaking change yang memperbaiki bug)
- [ ] ✨ New Feature (non-breaking change yang menambahkan functionality)
- [ ] 💥 Breaking Change (fix atau feature yang menyebabkan existing functionality tidak berfungsi seperti sebelumnya)
- [ ] 📚 Documentation Update (no code changes)
- [ ] 🎨 Style/UI Changes (no functional changes)
- [ ] ♻️ Refactoring (no functional changes)
- [ ] ⚡ Performance Improvements
- [ ] 🧪 Testing (menambah atau memperbaiki tests)
- [ ] 🛠️ Build/CI Changes (no functional changes)

## 🧪 Testing
- [ ] Saya sudah test changes ini di local environment
- [ ] Saya sudah test di multiple screen sizes
- [ ] API integrations masih berfungsi dengan baik
- [ ] All existing tests masih passing
- [ ] Saya sudah tambahkan tests untuk new functionality (jika applicable)

## 📋 Checklist

### Code Quality
- [ ] Code follows project's style guidelines
- [ ] Self-review kode sudah dilakukan
- [ ] Comments sudah ditambahkan untuk complex code
- [ ] No console.log() atau debugger statements
- [ ] No dead code atau unused imports

### Security
- [ ] No sensitive data yang exposure (API keys, passwords, etc.)
- [ ] Input validation sudah diimplementasi
- [ ] SQL injection sudah di-prevent
- [ ] XSS sudah di-mitigate

### Documentation
- [ ] README.md sudah diupdate (jika diperlukan)
- [ ] API documentation sudah diupdate
- [ ] Code comments sudah jelas dan helpful
- [ ] CHANGELOG.md sudah diupdate (jika applicable)

### Performance
- [ ] No memory leaks
- [ ] No infinite loops
- [ ] Database queries sudah optimized
- [ ] Bundle size tidak significant increase (jika applicable)

## 🔗 Related Issues
Closes # (issue number)

## 📸 Screenshots/Videos
Tambahkan screenshots atau videos untuk UI changes:

| Before | After |
|--------|-------|
| ![before](link-to-before-image) | ![after](link-to-after-image) |

## 📝 Additional Context
Tambahkan context lainnya yang mungkin helpful untuk reviewers:

- Background information tentang why change ini dibuat
- Alternative solutions yang sudah dipertimbangkan
- Specific areas yang perlu focus review
- Known limitations atau trade-offs

## 🚀 Deployment Notes
Apakah ada special instructions untuk deployment?

- [ ] Environment variables perlu diupdate
- [ ] Database migrations perlu dijalankan
- [ ] External services perlu dikonfigurasi ulang
- [ ] Cache invalidation diperlukan

## 👥 Reviewer Guidelines
Specific areas yang perlu attention dari reviewers:

- [ ] Architecture decisions
- [ ] Security implications  
- [ ] Performance impact
- [ ] API design
- [ ] User experience
- [ ] Mobile responsiveness

---

## 🏷️ Labels
Tambahkan labels yang relevan:

`type:bug`, `type:feature`, `type:documentation`, `priority:high`, `priority:medium`, `priority:low`, `component:frontend`, `component:backend`, `component:api`, `component:ui`

## 📋 Final Checklist
- [ ] PR description sudah complete dan accurate
- [ ] All checklist items sudah checked
- [ ] No pending changes dari branch ini
- [ ] Commit messages follow conventional commits format
- [ ] Branch name follows conventions (feature/, bugfix/, etc.)
- [ ] Ready untuk review