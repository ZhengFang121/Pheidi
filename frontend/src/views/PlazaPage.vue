<template>
  <section class="layout-container plaza-page">
    <header class="plaza-heading">
      <p class="plaza-eyebrow">PHEIDI PLAZA</p>

      <h1 class="plaza-title">菲迪廣場</h1>

      <p class="plaza-description">
        分享每一次奔跑的故事，與跑友交流心得，一起發現更多值得參與的跑步活動。
      </p>
    </header>

    <Tabs v-model:value="activeTab" class="plaza-tabs">
      <TabList>
        <Tab value="feed">
          <span class="tab-label">
            <UsersRound class="tab-icon" aria-hidden="true" />
            跑友動態
          </span>
        </Tab>

        <Tab value="events">
          <span class="tab-label">
            <CalendarDays class="tab-icon" aria-hidden="true" />
            活動情報
          </span>
        </Tab>
      </TabList>

      <TabPanels>
        <TabPanel value="feed">
          <div class="feed-content">
            <form class="post-composer" @submit.prevent="handleSubmitPost">
              <div class="composer-header">
                <CircleUserRound class="composer-avatar" aria-hidden="true" />

                <div>
                  <h2 class="composer-title">
                    {{ authStore.user?.username ?? '跑者' }}
                  </h2>

                  <p class="composer-description">今天想和跑友分享什麼？</p>
                </div>
              </div>

              <Textarea
                v-model="postContent"
                rows="5"
                maxlength="500"
                auto-resize
                placeholder="分享今天的跑步故事、心得或沿途風景……"
                aria-label="貼文內容"
                class="composer-textarea"
              />

              <div class="composer-footer">
                <div class="composer-tools">
                  <Button
                    type="button"
                    label="加入照片"
                    severity="secondary"
                    text
                    class="photo-button"
                  >
                    <template #icon>
                      <ImagePlus aria-hidden="true" />
                    </template>
                  </Button>

                  <span
                    class="character-count"
                    :class="{ 'character-count--warning': remainingCharacters <= 50 }"
                  >
                    還可以輸入 {{ remainingCharacters }} 個字
                  </span>
                </div>

                <Button type="submit" label="發布貼文" :disabled="!canSubmitPost">
                  <template #icon>
                    <Send aria-hidden="true" />
                  </template>
                </Button>
              </div>
            </form>

            <section class="feed-section" aria-labelledby="feed-heading">
              <div class="feed-heading-row">
                <div>
                  <p class="feed-eyebrow">RUNNER STORIES</p>
                  <h2 id="feed-heading" class="feed-heading">最新跑友動態</h2>
                </div>

                <span class="post-count">共 {{ posts.length }} 則</span>
              </div>

              <Message v-if="feedErrorMessage" severity="error" :closable="false">
                <div class="state-message">
                  <span>{{ feedErrorMessage }}</span>

                  <Button
                    type="button"
                    label="重新載入"
                    severity="secondary"
                    size="small"
                    @click="loadFeed"
                  />
                </div>
              </Message>

              <div v-else-if="isFeedLoading" class="post-list" aria-label="跑友動態載入中">
                <Skeleton
                  v-for="index in 2"
                  :key="index"
                  height="15rem"
                  border-radius="var(--radius-lg)"
                />
              </div>

              <div v-else-if="posts.length === 0" class="empty-state">
                <UsersRound class="empty-state-icon" aria-hidden="true" />

                <h3>目前還沒有跑友動態</h3>
                <p>成為第一位分享今天跑步故事的跑者吧！</p>
              </div>

              <div v-else class="post-list">
                <article v-for="post in posts" :key="post.id" class="post-card">
                  <header class="post-header">
                    <CircleUserRound class="post-avatar" aria-hidden="true" />

                    <div class="post-author-area">
                      <div class="post-author-row">
                        <h3 class="post-author">{{ post.author }}</h3>
                        <Tag :value="post.runnerLevel" severity="secondary" />
                      </div>

                      <time class="post-time" :datetime="post.createdAt">
                        {{ post.createdAtLabel }}
                      </time>
                    </div>
                  </header>

                  <p class="post-content">{{ post.content }}</p>

                  <footer class="post-stats" aria-label="貼文互動統計">
                    <button
                      type="button"
                      class="post-action"
                      :class="{ 'post-action--liked': post.isLiked }"
                      :aria-pressed="post.isLiked"
                      :aria-label="post.isLiked ? '取消按讚' : '按讚'"
                      @click="togglePostLike(post)"
                    >
                      <Heart :fill="post.isLiked ? 'currentColor' : 'none'" aria-hidden="true" />

                      {{ post.likeCount }} 個讚
                    </button>

                    <button
                      type="button"
                      class="post-action"
                      :class="{ 'post-action--active': activeCommentPostId === post.id }"
                      :aria-expanded="activeCommentPostId === post.id"
                      :aria-controls="`comment-section-${post.id}`"
                      @click="toggleCommentSection(post.id)"
                    >
                      <MessageCircle aria-hidden="true" />

                      {{ post.commentCount }} 則留言
                    </button>
                  </footer>

                  <div
                    v-if="activeCommentPostId === post.id"
                    :id="`comment-section-${post.id}`"
                    class="comment-section"
                  >
                    <form class="comment-form" @submit.prevent="handleSubmitComment(post)">
                      <Textarea
                        v-model="commentContent"
                        rows="3"
                        maxlength="200"
                        auto-resize
                        placeholder="寫下你的留言……"
                        :aria-label="`留言給 ${post.author}`"
                        class="comment-textarea"
                      />

                      <div class="comment-form-footer">
                        <span
                          class="character-count"
                          :class="{ 'character-count--warning': remainingCommentCharacters <= 20 }"
                        >
                          還可以輸入 {{ remainingCommentCharacters }} 個字
                        </span>

                        <Button
                          type="submit"
                          label="送出留言"
                          size="small"
                          :disabled="!canSubmitComment"
                        />
                      </div>
                    </form>

                    <div v-if="post.comments.length > 0" class="comment-list">
                      <article
                        v-for="comment in post.comments"
                        :key="comment.id"
                        class="comment-item"
                      >
                        <CircleUserRound class="comment-avatar" aria-hidden="true" />

                        <div class="comment-body">
                          <div class="comment-meta">
                            <h4 class="comment-author">{{ comment.author }}</h4>

                            <span class="comment-time">
                              {{ comment.createdAtLabel }}
                            </span>
                          </div>

                          <p class="comment-content">
                            {{ comment.content }}
                          </p>
                        </div>
                      </article>
                    </div>
                  </div>
                </article>
              </div>
            </section>
          </div>
        </TabPanel>

        <TabPanel value="events">
          <section class="event-section" aria-labelledby="event-heading">
            <div class="event-heading-row">
              <div>
                <p class="event-eyebrow">RUNNING EVENTS</p>
                <h2 id="event-heading" class="event-heading">近期跑步活動</h2>
              </div>

              <span class="event-count">共 {{ events.length }} 場</span>
            </div>

            <Message v-if="eventErrorMessage" severity="error" :closable="false">
              <div class="state-message">
                <span>{{ eventErrorMessage }}</span>

                <Button
                  type="button"
                  label="重新載入"
                  severity="secondary"
                  size="small"
                  @click="loadEvents"
                />
              </div>
            </Message>

            <div v-else-if="isEventLoading" class="event-grid" aria-label="活動情報載入中">
              <Skeleton
                v-for="index in 4"
                :key="index"
                height="22rem"
                border-radius="var(--radius-lg)"
              />
            </div>

            <div v-else-if="events.length === 0" class="empty-state">
              <CalendarDays class="empty-state-icon" aria-hidden="true" />

              <h3>目前沒有近期活動</h3>
              <p>新的跑步活動準備好後，會第一時間在這裡公布。</p>
            </div>

            <div v-else class="event-grid">
              <article v-for="event in events" :key="event.id" class="event-card">
                <div class="event-date" aria-hidden="true">
                  <span class="event-month">{{ event.month }}</span>
                  <strong class="event-day">{{ event.day }}</strong>
                </div>

                <div class="event-content">
                  <div class="event-title-row">
                    <h3 class="event-title">{{ event.title }}</h3>

                    <Tag :value="event.statusLabel" :severity="event.statusSeverity" />
                  </div>

                  <p class="event-description">
                    {{ event.description }}
                  </p>

                  <dl class="event-details">
                    <div class="event-detail">
                      <dt>
                        <MapPin aria-hidden="true" />
                        地點
                      </dt>
                      <dd>{{ event.location }}</dd>
                    </div>

                    <div class="event-detail">
                      <dt>
                        <Clock3 aria-hidden="true" />
                        時間
                      </dt>
                      <dd>{{ event.time }}</dd>
                    </div>

                    <div class="event-detail">
                      <dt>
                        <Route aria-hidden="true" />
                        距離
                      </dt>
                      <dd>{{ event.distance }}</dd>
                    </div>
                  </dl>

                  <Button
                    type="button"
                    label="查看活動"
                    severity="secondary"
                    outlined
                    class="event-button"
                  >
                    <template #icon>
                      <ArrowRight aria-hidden="true" />
                    </template>
                  </Button>
                </div>
              </article>
            </div>
          </section>
        </TabPanel>
      </TabPanels>
    </Tabs>
  </section>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import {
  ArrowRight,
  CalendarDays,
  CircleUserRound,
  Clock3,
  Heart,
  ImagePlus,
  MapPin,
  MessageCircle,
  Route,
  Send,
  UsersRound,
} from '@lucide/vue'

import Button from 'primevue/button'
import Message from 'primevue/message'
import Skeleton from 'primevue/skeleton'
import Tab from 'primevue/tab'
import TabList from 'primevue/tablist'
import TabPanel from 'primevue/tabpanel'
import TabPanels from 'primevue/tabpanels'
import Tabs from 'primevue/tabs'
import Tag from 'primevue/tag'
import Textarea from 'primevue/textarea'

import { useAuthStore } from '@/stores/auth'

type PlazaTab = 'feed' | 'events'

interface PlazaComment {
  id: number
  author: string
  content: string
  createdAtLabel: string
}

interface PlazaPost {
  id: number
  author: string
  runnerLevel: string
  createdAt: string
  createdAtLabel: string
  content: string
  isLiked: boolean
  likeCount: number
  commentCount: number
  comments: PlazaComment[]
}

type EventStatusSeverity = 'success' | 'warn' | 'secondary'

interface PlazaEvent {
  id: number
  month: string
  day: string
  title: string
  description: string
  location: string
  time: string
  distance: string
  statusLabel: string
  statusSeverity: EventStatusSeverity
}

const authStore = useAuthStore()

const activeTab = ref<PlazaTab>('feed')
const maximumPostLength = 500
const postContent = ref('')
const activeCommentPostId = ref<number | null>(null)
const commentContent = ref('')
const maximumCommentLength = 200
const isFeedLoading = ref(false)
const feedErrorMessage = ref('')
const isEventLoading = ref(false)
const eventErrorMessage = ref('')
const posts = ref<PlazaPost[]>([
  {
    id: 2,
    author: '晨光跑者',
    runnerLevel: '冒險者',
    createdAt: '2026-08-25T07:30:00+08:00',
    createdAtLabel: '今天 07:30',
    content: '今天第一次不看配速，只跟著呼吸跑完河濱。原來放慢一點，也能看見沿途更多風景。',
    isLiked: false,
    likeCount: 18,
    commentCount: 4,
    comments: [],
  },
  {
    id: 1,
    author: '小步向前',
    runnerLevel: '習跑者',
    createdAt: '2026-08-24T18:45:00+08:00',
    createdAtLabel: '昨天 18:45',
    content: '下班後完成 3 公里！雖然速度不快，但今天也有好好替自己留下足跡。',
    isLiked: false,
    likeCount: 12,
    commentCount: 2,
    comments: [],
  },
])

const events = ref<PlazaEvent[]>([
  {
    id: 1,
    month: 'SEP',
    day: '06',
    title: '河濱晨光練跑',
    description: '適合剛開始跑步的跑者，一起用舒服的節奏迎接早晨。',
    location: '大佳河濱公園',
    time: '06:30－08:00',
    distance: '3K／5K',
    statusLabel: '報名中',
    statusSeverity: 'success',
  },
  {
    id: 2,
    month: 'SEP',
    day: '13',
    title: '不看數字的一天',
    description: '放下配速與里程，只感受呼吸、腳步和沿途風景。',
    location: '台北市大安森林公園',
    time: '16:00－17:30',
    distance: '自由距離',
    statusLabel: '即將額滿',
    statusSeverity: 'warn',
  },
  {
    id: 3,
    month: 'OCT',
    day: '04',
    title: '菲迪城市探索跑',
    description: '跟著線索穿梭城市，在奔跑途中尋找菲迪留下的神秘足跡。',
    location: '台北市信義區',
    time: '07:00－10:00',
    distance: '8K',
    statusLabel: '即將開放',
    statusSeverity: 'secondary',
  },
])

const remainingCharacters = computed(() => maximumPostLength - postContent.value.length)

const canSubmitPost = computed(() => postContent.value.trim().length > 0)

const remainingCommentCharacters = computed(
  () => maximumCommentLength - commentContent.value.length,
)

const canSubmitComment = computed(() => commentContent.value.trim().length > 0)

let feedLoadingTimer: ReturnType<typeof setTimeout> | null = null
let eventLoadingTimer: ReturnType<typeof setTimeout> | null = null

function loadFeed() {
  feedErrorMessage.value = ''
  isFeedLoading.value = true

  if (feedLoadingTimer) clearTimeout(feedLoadingTimer)

  feedLoadingTimer = setTimeout(() => {
    isFeedLoading.value = false
    feedLoadingTimer = null
  }, 700)
}

function loadEvents() {
  eventErrorMessage.value = ''
  isEventLoading.value = true

  if (eventLoadingTimer) clearTimeout(eventLoadingTimer)

  eventLoadingTimer = setTimeout(() => {
    isEventLoading.value = false
    eventLoadingTimer = null
  }, 900)
}

function handleSubmitPost() {
  const content = postContent.value.trim()

  if (!content) return

  posts.value.unshift({
    id: Date.now(),
    author: authStore.user?.username ?? '跑者',
    runnerLevel: '啟程者',
    createdAt: new Date().toISOString(),
    createdAtLabel: '剛剛',
    content,
    isLiked: false,
    likeCount: 0,
    commentCount: 0,
    comments: [],
  })

  postContent.value = ''
}

function togglePostLike(post: PlazaPost) {
  post.isLiked = !post.isLiked
  post.likeCount += post.isLiked ? 1 : -1
}

function toggleCommentSection(postId: number) {
  if (activeCommentPostId.value === postId) {
    activeCommentPostId.value = null
    commentContent.value = ''
    return
  }

  activeCommentPostId.value = postId
  commentContent.value = ''
}

function handleSubmitComment(post: PlazaPost) {
  const content = commentContent.value.trim()

  if (!content) return

  post.comments.push({
    id: Date.now(),
    author: authStore.user?.username ?? '跑者',
    content,
    createdAtLabel: '剛剛',
  })

  post.commentCount += 1
  commentContent.value = ''
}

onMounted(() => {
  loadFeed()
  loadEvents()
})

onBeforeUnmount(() => {
  if (feedLoadingTimer) clearTimeout(feedLoadingTimer)
  if (eventLoadingTimer) clearTimeout(eventLoadingTimer)
})
</script>

<style scoped>
.plaza-page {
  display: flex;
  flex-direction: column;
  gap: var(--space-7);

  padding-block: var(--space-7) var(--space-8);
}

.plaza-heading {
  max-width: 720px;
}

.plaza-eyebrow {
  margin: 0 0 var(--space-2);

  color: var(--color-primary);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  letter-spacing: var(--letter-spacing-wide);
}

.plaza-title {
  margin: 0 0 var(--space-3);

  color: var(--color-text);
  font-size: var(--font-size-xl);
  line-height: var(--line-height-heading);
}

.plaza-description {
  margin: 0;

  color: var(--color-text-secondary);
  line-height: var(--line-height-base);
}

.plaza-tabs {
  width: 100%;
}

.plaza-tabs :deep(.p-tablist-tab-list) {
  gap: var(--space-5);

  background: transparent;
  border-color: var(--color-border);
}

.plaza-tabs :deep(.p-tab) {
  padding: var(--space-3) var(--space-2);

  color: var(--color-text-secondary);
  font-family: var(--font-family-base);
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-medium);
}

.plaza-tabs :deep(.p-tab:hover) {
  color: var(--color-accent);
}

.plaza-tabs :deep(.p-tab-active) {
  color: var(--color-primary);
}

.plaza-tabs :deep(.p-tablist-active-bar) {
  background: var(--color-primary);
}

.plaza-tabs :deep(.p-tabpanels) {
  padding: var(--space-6) 0 0;

  background: transparent;
}

.tab-placeholder {
  margin: 0;

  color: var(--color-text-secondary);
}

.tab-label {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
}

.tab-icon {
  width: 22px;
  height: 22px;

  flex-shrink: 0;
  stroke-width: 2;
}

.feed-content {
  display: flex;
  flex-direction: column;
  gap: var(--space-7);
}

.post-composer {
  display: flex;
  flex-direction: column;
  gap: var(--space-5);

  padding: var(--space-6);

  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
}

.composer-header {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.composer-avatar {
  width: 48px;
  height: 48px;

  flex-shrink: 0;

  color: var(--color-primary);
  stroke-width: 1.8;
}

.composer-title {
  margin: 0;

  color: var(--color-text);
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-medium);
  line-height: var(--line-height-heading);
}

.composer-description {
  margin: var(--space-1) 0 0;

  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
}

.composer-textarea {
  width: 100%;

  font-family: var(--font-family-base);
  line-height: var(--line-height-base);
  resize: vertical;
}

.composer-footer,
.composer-tools {
  display: flex;
  align-items: center;
}

.composer-footer {
  justify-content: space-between;
  gap: var(--space-4);
}

.composer-tools {
  gap: var(--space-4);
}

.photo-button :deep(svg),
.composer-footer :deep(.p-button svg) {
  width: 20px;
  height: 20px;
}

.character-count {
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
}

.character-count--warning {
  color: var(--color-accent);
  font-weight: var(--font-weight-medium);
}

.feed-section {
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
}

.feed-heading-row,
.post-author-row,
.post-stats {
  display: flex;
  align-items: center;
}

.feed-heading-row {
  justify-content: space-between;
  gap: var(--space-4);
}

.feed-eyebrow {
  margin: 0 0 var(--space-1);

  color: var(--color-primary);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-medium);
  letter-spacing: var(--letter-spacing-wide);
}

.feed-heading {
  margin: 0;

  color: var(--color-text);
  font-size: var(--font-size-md);
  line-height: var(--line-height-heading);
}

.post-count {
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
}

.post-list {
  display: grid;
  gap: var(--space-5);
}

.post-card {
  display: flex;
  flex-direction: column;
  gap: var(--space-5);

  padding: var(--space-6);

  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
}

.post-header {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.post-avatar {
  width: 44px;
  height: 44px;

  flex-shrink: 0;

  color: var(--color-secondary);
  stroke-width: 1.8;
}

.post-author-area {
  min-width: 0;
}

.post-author-row {
  flex-wrap: wrap;
  gap: var(--space-2);
}

.post-author {
  margin: 0;

  color: var(--color-text);
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-medium);
}

.post-time {
  display: block;
  margin-top: var(--space-1);

  color: var(--color-text-secondary);
  font-size: var(--font-size-xs);
}

.post-content {
  margin: 0;

  color: var(--color-text);
  line-height: var(--line-height-base);
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}

.post-stats {
  gap: var(--space-5);

  padding-top: var(--space-4);

  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
  border-top: 1px solid var(--color-border);
}

.post-action {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);

  padding: var(--space-2);

  color: var(--color-text-secondary);
  font-family: var(--font-family-base);
  font-size: var(--font-size-sm);

  cursor: pointer;

  background: transparent;
  border: 0;
  border-radius: var(--radius-sm);

  transition:
    color 0.2s ease,
    background-color 0.2s ease,
    transform 0.2s ease;
}

.post-action:hover {
  color: var(--color-accent);
  background: var(--color-accent-pale);
}

.post-action:active {
  transform: scale(0.96);
}

.post-action:focus-visible {
  outline: 3px solid var(--color-accent-soft);
  outline-offset: 2px;
}

.post-action--liked {
  color: var(--color-accent);
}

.post-action svg {
  width: 18px;
  height: 18px;

  flex-shrink: 0;
}

.post-action--active {
  color: var(--color-primary);
  background: var(--color-primary-pale);
}

.comment-section {
  padding-top: var(--space-5);

  border-top: 1px solid var(--color-border);
}

.comment-form {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.comment-textarea {
  width: 100%;

  font-family: var(--font-family-base);
  line-height: var(--line-height-base);
  resize: vertical;
}

.comment-form-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-4);
}

.comment-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);

  margin-top: var(--space-5);
}

.comment-item {
  display: flex;
  align-items: flex-start;
  gap: var(--space-3);

  padding: var(--space-4);

  background: var(--color-background);
  border-radius: var(--radius-md);
}

.comment-avatar {
  width: 32px;
  height: 32px;

  flex-shrink: 0;

  color: var(--color-primary);
  stroke-width: 1.8;
}

.comment-body {
  min-width: 0;
  flex: 1;
}

.comment-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
}

.comment-author {
  margin: 0;

  color: var(--color-text);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
}

.comment-time {
  flex-shrink: 0;

  color: var(--color-text-secondary);
  font-size: var(--font-size-xs);
}

.comment-content {
  margin: var(--space-2) 0 0;

  color: var(--color-text);
  font-size: var(--font-size-sm);
  line-height: var(--line-height-base);
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}

.event-section {
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
}

.event-heading-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-4);
}

.event-eyebrow {
  margin: 0 0 var(--space-1);

  color: var(--color-primary);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-medium);
  letter-spacing: var(--letter-spacing-wide);
}

.event-heading {
  margin: 0;

  color: var(--color-text);
  font-size: var(--font-size-md);
  line-height: var(--line-height-heading);
}

.event-count {
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
}

.event-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--space-5);
}

.event-card {
  display: flex;
  align-items: flex-start;
  gap: var(--space-5);

  padding: var(--space-6);

  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);

  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease;
}

.event-card:hover {
  box-shadow: var(--shadow-md);
  transform: translateY(-4px);
}

.event-date {
  display: flex;
  width: 72px;
  height: 80px;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  flex-direction: column;

  color: var(--color-text);

  background: var(--color-primary-pale);
  border-radius: var(--radius-md);
}

.event-month {
  color: var(--color-primary);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-medium);
  letter-spacing: var(--letter-spacing-wide);
}

.event-day {
  font-size: var(--font-size-lg);
  line-height: var(--line-height-tight);
}

.event-content {
  display: flex;
  min-width: 0;
  flex: 1;
  flex-direction: column;
  gap: var(--space-4);
}

.event-title-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--space-3);
}

.event-title {
  margin: 0;

  color: var(--color-text);
  font-size: var(--font-size-md);
  line-height: var(--line-height-heading);
}

.event-description {
  margin: 0;

  color: var(--color-text-secondary);
  line-height: var(--line-height-base);
}

.event-details {
  display: grid;
  gap: var(--space-2);

  margin: 0;
}

.event-detail {
  display: grid;
  grid-template-columns: 72px minmax(0, 1fr);
  gap: var(--space-3);
}

.event-detail dt {
  display: flex;
  align-items: center;
  gap: var(--space-2);

  color: var(--color-primary);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
}

.event-detail dd {
  margin: 0;

  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
}

.event-detail svg {
  width: 16px;
  height: 16px;

  flex-shrink: 0;
}

.event-button {
  align-self: flex-end;
}

.event-button :deep(svg) {
  width: 18px;
  height: 18px;
}

.state-message {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-4);

  width: 100%;
}

.empty-state {
  display: flex;
  align-items: center;
  flex-direction: column;
  gap: var(--space-3);

  padding: var(--space-8) var(--space-5);

  color: var(--color-text-secondary);
  text-align: center;

  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
}

.empty-state h3,
.empty-state p {
  margin: 0;
}

.empty-state h3 {
  color: var(--color-text);
  font-size: var(--font-size-md);
}

.empty-state-icon {
  width: 48px;
  height: 48px;

  color: var(--color-primary);
  stroke-width: 1.6;
}

@media (max-width: 1024px) {
  .event-grid {
    grid-template-columns: minmax(0, 1fr);
  }
}

@media (max-width: 640px) {
  .plaza-page {
    gap: var(--space-5);

    padding-block: var(--space-5) var(--space-7);
  }

  .plaza-title {
    font-size: var(--font-size-lg);
  }

  .plaza-tabs :deep(.p-tablist-tab-list) {
    gap: var(--space-3);
  }

  .plaza-tabs :deep(.p-tab) {
    flex: 1;
    justify-content: center;
  }

  .plaza-tabs :deep(.p-tabpanels) {
    padding-top: var(--space-5);
  }

  .post-composer {
    padding: var(--space-5);
  }

  .feed-content {
    gap: var(--space-5);
  }

  .composer-footer {
    align-items: stretch;
    flex-direction: column;
  }

  .composer-tools {
    justify-content: space-between;
  }

  .composer-footer :deep(.p-button:not(.photo-button)) {
    width: 100%;
  }

  .post-card {
    gap: var(--space-4);

    padding: var(--space-5);
  }

  .post-stats {
    justify-content: space-between;
    gap: var(--space-3);
  }

  .event-card {
    flex-direction: column;
    gap: var(--space-4);

    padding: var(--space-5);
  }

  .event-date {
    width: 64px;
    height: 72px;
  }

  .event-title-row {
    align-items: flex-start;
    flex-direction: column;
  }

  .event-button {
    width: 100%;
  }

  .state-message {
    align-items: stretch;
    flex-direction: column;
  }

  .empty-state {
    padding: var(--space-7) var(--space-5);
  }
}
</style>
