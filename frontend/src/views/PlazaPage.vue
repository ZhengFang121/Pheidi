<template>
  <section class="layout-container plaza-page">
    <ConfirmDialog />

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

              <input
                ref="postImageInput"
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                class="post-image-input"
                @change="handlePostImageChange"
              />

              <Message v-if="postImageErrorMessage" severity="error" :closable="false">
                {{ postImageErrorMessage }}
              </Message>

              <div v-if="postImagePreviewUrl" class="composer-image-preview">
                <img
                  :src="postImagePreviewUrl"
                  alt="準備發布的貼文圖片預覽"
                  class="composer-preview-image"
                />

                <Button
                  type="button"
                  label="移除照片"
                  severity="danger"
                  text
                  size="small"
                  class="remove-photo-button"
                  :disabled="isSubmittingPost"
                  @click="clearPostImage"
                />
              </div>

              <div class="composer-footer">
                <div class="composer-tools">
                  <Button
                    type="button"
                    :label="postImagePreviewUrl ? '更換照片' : '加入照片'"
                    severity="secondary"
                    text
                    class="photo-button"
                    :disabled="isSubmittingPost"
                    @click="openPostImagePicker"
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

                <Button
                  type="submit"
                  label="發布貼文"
                  :loading="isSubmittingPost || isUploadingPostImage"
                  :disabled="!canSubmitPost || isSubmittingPost"
                >
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

                <span class="post-count">共 {{ totalPosts }} 則</span>
              </div>

              <Message v-if="postActionErrorMessage" severity="error" :closable="false">
                {{ postActionErrorMessage }}
              </Message>

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
                        <h3 class="post-author">{{ post.author.username }}</h3>
                        <Tag :value="post.runnerLevel" severity="secondary" />
                      </div>

                      <time class="post-time" :datetime="post.createdAt">
                        {{ post.createdAtLabel }}
                      </time>
                    </div>
                  </header>

                  <p class="post-content">{{ post.content }}</p>

                  <img
                    v-if="post.imageUrl"
                    :src="post.imageUrl"
                    :alt="`${post.author.username} 的貼文圖片`"
                    class="post-image"
                    loading="lazy"
                  />

                  <footer class="post-stats" aria-label="貼文互動統計">
                    <button
                      type="button"
                      class="post-action"
                      :class="{ 'post-action--liked': post.isLiked }"
                      :aria-pressed="post.isLiked"
                      :aria-label="post.isLiked ? '取消按讚' : '按讚'"
                      :aria-busy="isPostLikePending(post.id)"
                      :disabled="isPostLikePending(post.id)"
                      @click="handleTogglePostLike(post)"
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
                      @click="toggleCommentSection(post)"
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
                    <Message
                      v-if="commentErrorMessage"
                      severity="error"
                      :closable="false"
                      class="comment-message"
                    >
                      {{ commentErrorMessage }}
                    </Message>

                    <form class="comment-form" @submit.prevent="handleSubmitComment(post)">
                      <Textarea
                        v-model="commentContent"
                        rows="3"
                        maxlength="200"
                        auto-resize
                        placeholder="寫下你的留言……"
                        :aria-label="`留言給 ${post.author.username}`"
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
                          :loading="isCommentSubmitting(post.id)"
                          :disabled="!canSubmitComment || isCommentSubmitting(post.id)"
                        />
                      </div>
                    </form>

                    <Skeleton
                      v-if="isCommentLoading(post.id)"
                      height="6rem"
                      border-radius="var(--radius-md)"
                      class="comment-skeleton"
                    />

                    <div v-else-if="post.comments.length > 0" class="comment-list">
                      <article
                        v-for="comment in post.comments"
                        :key="comment.id"
                        class="comment-item"
                      >
                        <CircleUserRound class="comment-avatar" aria-hidden="true" />

                        <div class="comment-body">
                          <div class="comment-meta">
                            <h4 class="comment-author">{{ comment.author.username }}</h4>

                            <div class="comment-meta-actions">
                              <span class="comment-time">
                                {{ comment.createdAtLabel }}
                                <span v-if="comment.updatedAt !== comment.createdAt"
                                  >（已編輯）</span
                                >
                              </span>

                              <div
                                v-if="canEditComment(comment) || canDeleteComment(comment)"
                                class="comment-management-actions"
                              >
                                <Button
                                  v-if="canEditComment(comment)"
                                  type="button"
                                  severity="secondary"
                                  text
                                  rounded
                                  size="small"
                                  :aria-label="`編輯 ${comment.author.username} 的留言`"
                                  :disabled="
                                    updatingCommentId !== null || deletingCommentId === comment.id
                                  "
                                  @click="startEditingComment(comment)"
                                >
                                  <template #icon>
                                    <Pencil aria-hidden="true" />
                                  </template>
                                </Button>

                                <Button
                                  v-if="canDeleteComment(comment)"
                                  type="button"
                                  severity="danger"
                                  text
                                  rounded
                                  size="small"
                                  :aria-label="`刪除 ${comment.author.username} 的留言`"
                                  :loading="deletingCommentId === comment.id"
                                  :disabled="
                                    updatingCommentId !== null ||
                                    (deletingCommentId !== null && deletingCommentId !== comment.id)
                                  "
                                  @click="confirmDeleteComment(post, comment)"
                                >
                                  <template #icon>
                                    <Trash2 aria-hidden="true" />
                                  </template>
                                </Button>
                              </div>
                            </div>
                          </div>

                          <div v-if="editingCommentId === comment.id" class="comment-edit-form">
                            <Textarea
                              v-model="editingCommentContent"
                              rows="3"
                              maxlength="200"
                              auto-resize
                              aria-label="編輯留言內容"
                              class="comment-textarea"
                            />

                            <div class="comment-edit-footer">
                              <span class="character-count">
                                還可以輸入 {{ remainingEditCommentCharacters }} 個字
                              </span>

                              <div class="comment-edit-actions">
                                <Button
                                  type="button"
                                  label="取消"
                                  severity="secondary"
                                  text
                                  size="small"
                                  :disabled="updatingCommentId === comment.id"
                                  @click="cancelEditingComment"
                                />

                                <Button
                                  type="button"
                                  label="儲存"
                                  size="small"
                                  :loading="updatingCommentId === comment.id"
                                  :disabled="!canSaveEditedComment"
                                  @click="handleUpdateComment(post, comment)"
                                />
                              </div>
                            </div>
                          </div>

                          <p v-else class="comment-content">
                            {{ comment.content }}
                          </p>

                          <button
                            type="button"
                            class="comment-like-button"
                            :class="{ 'comment-like-button--liked': comment.isLiked }"
                            :aria-pressed="comment.isLiked"
                            :aria-label="comment.isLiked ? '取消留言按讚' : '按讚留言'"
                            :disabled="
                              isCommentLikePending(comment.id) ||
                              deletingCommentId === comment.id ||
                              updatingCommentId === comment.id
                            "
                            @click="handleToggleCommentLike(post, comment)"
                          >
                            <Heart
                              :fill="comment.isLiked ? 'currentColor' : 'none'"
                              aria-hidden="true"
                            />
                            {{ comment.likeCount }}
                          </button>
                        </div>
                      </article>
                    </div>

                    <p v-else class="comment-empty">目前還沒有留言，成為第一位留言的跑友吧！</p>
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
import { isAxiosError } from 'axios'
import {
  ArrowRight,
  CalendarDays,
  CircleUserRound,
  Clock3,
  Heart,
  ImagePlus,
  MapPin,
  MessageCircle,
  Pencil,
  Route,
  Send,
  Trash2,
  UsersRound,
} from '@lucide/vue'

import Button from 'primevue/button'
import ConfirmDialog from 'primevue/confirmdialog'
import Message from 'primevue/message'
import Skeleton from 'primevue/skeleton'
import Tab from 'primevue/tab'
import TabList from 'primevue/tablist'
import TabPanel from 'primevue/tabpanel'
import TabPanels from 'primevue/tabpanels'
import Tabs from 'primevue/tabs'
import Tag from 'primevue/tag'
import Textarea from 'primevue/textarea'
import { useConfirm } from 'primevue/useconfirm'

import {
  createPost,
  createPostComment,
  deletePostComment,
  getPostComments,
  getPosts,
  togglePostCommentLike,
  togglePostLike,
  updatePostComment,
} from '@/services/posts'
import { uploadPostImage } from '@/services/uploads'
import { useAuthStore } from '@/stores/auth'
import type { PlazaPost as ApiPlazaPost, PostComment as ApiPostComment } from '@/types/post'

type PlazaTab = 'feed' | 'events'

interface PlazaCommentView extends ApiPostComment {
  createdAtLabel: string
}

interface PlazaPostView extends ApiPlazaPost {
  runnerLevel: string
  createdAtLabel: string
  comments: PlazaCommentView[]
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
const confirm = useConfirm()

const activeTab = ref<PlazaTab>('feed')
const maximumPostLength = 500
const maximumPostImageSize = 5 * 1024 * 1024
const allowedPostImageTypes = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
const postContent = ref('')
const postImageInput = ref<HTMLInputElement | null>(null)
const selectedPostImage = ref<File | null>(null)
const postImagePreviewUrl = ref('')
const uploadedPostImageUrl = ref('')
const uploadedPostImagePublicId = ref('')
const postImageErrorMessage = ref('')
const isUploadingPostImage = ref(false)
const activeCommentPostId = ref<string | null>(null)
const commentContent = ref('')
const maximumCommentLength = 200
const commentErrorMessage = ref('')
const loadedCommentPostIds = ref(new Set<string>())
const loadingCommentPostIds = ref(new Set<string>())
const submittingCommentPostIds = ref(new Set<string>())
const pendingCommentLikeIds = ref(new Set<string>())
const editingCommentId = ref<string | null>(null)
const editingCommentContent = ref('')
const updatingCommentId = ref<string | null>(null)
const deletingCommentId = ref<string | null>(null)
const isFeedLoading = ref(false)
const isSubmittingPost = ref(false)
const feedErrorMessage = ref('')
const postActionErrorMessage = ref('')
const pendingPostLikeIds = ref(new Set<string>())
const isEventLoading = ref(false)
const eventErrorMessage = ref('')
const posts = ref<PlazaPostView[]>([])
const totalPosts = ref(0)

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

const remainingEditCommentCharacters = computed(
  () => maximumCommentLength - editingCommentContent.value.length,
)

const canSaveEditedComment = computed(
  () => editingCommentContent.value.trim().length > 0 && updatingCommentId.value === null,
)

let eventLoadingTimer: ReturnType<typeof setTimeout> | null = null

const postDateFormatter = new Intl.DateTimeFormat('zh-TW', {
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
})

function formatPostDate(date: string) {
  const parsedDate = new Date(date)

  return Number.isNaN(parsedDate.getTime()) ? date : postDateFormatter.format(parsedDate)
}

function toPostView(post: ApiPlazaPost): PlazaPostView {
  return {
    ...post,
    runnerLevel: '啟程者',
    createdAtLabel: formatPostDate(post.createdAt),
    comments: [],
  }
}

function toCommentView(comment: ApiPostComment): PlazaCommentView {
  return {
    ...comment,
    createdAtLabel: formatPostDate(comment.createdAt),
  }
}

function getApiErrorMessage(error: unknown, fallbackMessage: string) {
  if (!isAxiosError<{ message?: string }>(error)) return fallbackMessage

  return error.response?.data?.message ?? fallbackMessage
}

async function loadFeed() {
  feedErrorMessage.value = ''
  isFeedLoading.value = true

  try {
    const response = await getPosts({ page: 1, limit: 10 })

    posts.value = response.posts.map(toPostView)
    totalPosts.value = response.pagination.total
    loadedCommentPostIds.value.clear()
    activeCommentPostId.value = null
  } catch (error: unknown) {
    feedErrorMessage.value = getApiErrorMessage(error, '載入跑友動態失敗，請稍後再試。')
  } finally {
    isFeedLoading.value = false
  }
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

function openPostImagePicker() {
  postImageInput.value?.click()
}

function revokePostImagePreviewUrl() {
  if (!postImagePreviewUrl.value) return

  URL.revokeObjectURL(postImagePreviewUrl.value)
  postImagePreviewUrl.value = ''
}

function clearPostImage() {
  revokePostImagePreviewUrl()
  selectedPostImage.value = null
  uploadedPostImageUrl.value = ''
  uploadedPostImagePublicId.value = ''
  postImageErrorMessage.value = ''

  if (postImageInput.value) postImageInput.value.value = ''
}

function handlePostImageChange(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]

  input.value = ''
  postImageErrorMessage.value = ''

  if (!file) return

  if (!allowedPostImageTypes.has(file.type)) {
    postImageErrorMessage.value = '貼文圖片只支援 JPG、PNG、WebP 或 GIF'
    return
  }

  if (file.size > maximumPostImageSize) {
    postImageErrorMessage.value = '貼文圖片不能超過 5 MB'
    return
  }

  revokePostImagePreviewUrl()
  selectedPostImage.value = file
  uploadedPostImageUrl.value = ''
  uploadedPostImagePublicId.value = ''
  postImagePreviewUrl.value = URL.createObjectURL(file)
}

async function handleSubmitPost() {
  const content = postContent.value.trim()

  if (!content || isSubmittingPost.value) return

  feedErrorMessage.value = ''
  postImageErrorMessage.value = ''
  isSubmittingPost.value = true

  if (selectedPostImage.value && !uploadedPostImageUrl.value) {
    isUploadingPostImage.value = true

    try {
      const uploadResponse = await uploadPostImage(selectedPostImage.value)

      uploadedPostImageUrl.value = uploadResponse.image.url
      uploadedPostImagePublicId.value = uploadResponse.image.publicId
    } catch (error: unknown) {
      postImageErrorMessage.value = getApiErrorMessage(error, '貼文圖片上傳失敗，請稍後再試。')
      isSubmittingPost.value = false
      isUploadingPostImage.value = false
      return
    } finally {
      isUploadingPostImage.value = false
    }
  }

  try {
    const response = await createPost({
      content,
      ...(uploadedPostImageUrl.value
        ? {
            imageUrl: uploadedPostImageUrl.value,
            imagePublicId: uploadedPostImagePublicId.value,
          }
        : {}),
    })

    posts.value.unshift(toPostView(response.post))
    totalPosts.value += 1
    postContent.value = ''
    clearPostImage()
  } catch (error: unknown) {
    feedErrorMessage.value = getApiErrorMessage(error, '發布貼文失敗，請稍後再試。')
  } finally {
    isSubmittingPost.value = false
  }
}

function isPostLikePending(postId: string) {
  return pendingPostLikeIds.value.has(postId)
}

async function handleTogglePostLike(post: PlazaPostView) {
  if (isPostLikePending(post.id)) return

  postActionErrorMessage.value = ''
  pendingPostLikeIds.value.add(post.id)

  try {
    const response = await togglePostLike(post.id)

    post.isLiked = response.isLiked
    post.likeCount = response.likeCount
  } catch (error: unknown) {
    postActionErrorMessage.value = getApiErrorMessage(error, '更新按讚狀態失敗，請稍後再試。')
  } finally {
    pendingPostLikeIds.value.delete(post.id)
  }
}

function isCommentLoading(postId: string) {
  return loadingCommentPostIds.value.has(postId)
}

function isCommentSubmitting(postId: string) {
  return submittingCommentPostIds.value.has(postId)
}

async function toggleCommentSection(post: PlazaPostView) {
  if (activeCommentPostId.value === post.id) {
    activeCommentPostId.value = null
    commentContent.value = ''
    commentErrorMessage.value = ''
    cancelEditingComment()
    return
  }

  cancelEditingComment()
  activeCommentPostId.value = post.id
  commentContent.value = ''
  commentErrorMessage.value = ''

  if (loadedCommentPostIds.value.has(post.id)) return

  loadingCommentPostIds.value.add(post.id)

  try {
    const response = await getPostComments(post.id, { page: 1, limit: 50 })

    post.comments = response.comments.map(toCommentView)
    post.commentCount = response.pagination.total
    loadedCommentPostIds.value.add(post.id)
  } catch (error: unknown) {
    commentErrorMessage.value = getApiErrorMessage(error, '載入留言失敗，請稍後再試。')
  } finally {
    loadingCommentPostIds.value.delete(post.id)
  }
}

async function handleSubmitComment(post: PlazaPostView) {
  const content = commentContent.value.trim()

  if (!content || isCommentSubmitting(post.id)) return

  commentErrorMessage.value = ''
  submittingCommentPostIds.value.add(post.id)

  try {
    const response = await createPostComment(post.id, { content })

    post.comments.unshift(toCommentView(response.comment))
    post.commentCount = response.commentCount
    loadedCommentPostIds.value.add(post.id)
    commentContent.value = ''
  } catch (error: unknown) {
    commentErrorMessage.value = getApiErrorMessage(error, '發布留言失敗，請稍後再試。')
  } finally {
    submittingCommentPostIds.value.delete(post.id)
  }
}

function canEditComment(comment: PlazaCommentView) {
  return comment.author._id === authStore.user?.id
}

function canDeleteComment(comment: PlazaCommentView) {
  return canEditComment(comment) || authStore.isAdmin
}

function isCommentLikePending(commentId: string) {
  return pendingCommentLikeIds.value.has(commentId)
}

async function handleToggleCommentLike(post: PlazaPostView, comment: PlazaCommentView) {
  if (isCommentLikePending(comment.id)) return

  commentErrorMessage.value = ''
  pendingCommentLikeIds.value.add(comment.id)

  try {
    const response = await togglePostCommentLike(post.id, comment.id)

    comment.isLiked = response.isLiked
    comment.likeCount = response.likeCount
  } catch (error: unknown) {
    commentErrorMessage.value = getApiErrorMessage(error, '更新留言按讚狀態失敗，請稍後再試。')
  } finally {
    pendingCommentLikeIds.value.delete(comment.id)
  }
}

function startEditingComment(comment: PlazaCommentView) {
  if (updatingCommentId.value || deletingCommentId.value) return

  editingCommentId.value = comment.id
  editingCommentContent.value = comment.content
  commentErrorMessage.value = ''
}

function cancelEditingComment() {
  editingCommentId.value = null
  editingCommentContent.value = ''
}

async function handleUpdateComment(post: PlazaPostView, comment: PlazaCommentView) {
  const content = editingCommentContent.value.trim()

  if (!content || updatingCommentId.value) return

  commentErrorMessage.value = ''
  updatingCommentId.value = comment.id

  try {
    const response = await updatePostComment(post.id, comment.id, { content })
    const commentIndex = post.comments.findIndex(
      (currentComment) => currentComment.id === comment.id,
    )

    if (commentIndex !== -1) {
      post.comments[commentIndex] = toCommentView(response.comment)
    }

    cancelEditingComment()
  } catch (error: unknown) {
    commentErrorMessage.value = getApiErrorMessage(error, '更新留言失敗，請稍後再試。')
  } finally {
    updatingCommentId.value = null
  }
}

async function handleDeleteComment(post: PlazaPostView, comment: PlazaCommentView) {
  deletingCommentId.value = comment.id
  commentErrorMessage.value = ''

  try {
    const response = await deletePostComment(post.id, comment.id)

    post.comments = post.comments.filter((currentComment) => currentComment.id !== comment.id)
    post.commentCount = response.commentCount

    if (editingCommentId.value === comment.id) cancelEditingComment()
  } catch (error: unknown) {
    commentErrorMessage.value = getApiErrorMessage(error, '刪除留言失敗，請稍後再試。')
  } finally {
    deletingCommentId.value = null
  }
}

function confirmDeleteComment(post: PlazaPostView, comment: PlazaCommentView) {
  confirm.require({
    header: '確認刪除留言',
    message: `確定要刪除「${comment.content}」嗎？此操作無法復原。`,
    icon: 'pi pi-exclamation-triangle',
    acceptLabel: '確認刪除',
    rejectLabel: '取消',
    acceptClass: 'p-button-danger',
    accept: () => {
      void handleDeleteComment(post, comment)
    },
  })
}

onMounted(() => {
  void loadFeed()
  loadEvents()
})

onBeforeUnmount(() => {
  revokePostImagePreviewUrl()
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

.post-image-input {
  position: absolute;

  width: 1px;
  height: 1px;
  padding: 0;
  overflow: hidden;

  white-space: nowrap;

  clip: rect(0, 0, 0, 0);
  border: 0;
}

.composer-image-preview {
  position: relative;

  width: min(100%, 640px);
  overflow: hidden;

  background: var(--color-background);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
}

.composer-preview-image {
  display: block;
  width: 100%;
  max-height: 480px;

  object-fit: contain;
}

.remove-photo-button {
  position: absolute;
  top: var(--space-2);
  right: var(--space-2);

  background: color-mix(in srgb, var(--color-surface) 88%, transparent);
  backdrop-filter: blur(8px);
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

.post-image {
  display: block;
  width: 100%;
  height: auto;
  max-height: 640px;

  object-fit: contain;

  background: var(--color-background);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
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

.post-action:disabled {
  cursor: wait;
  opacity: 0.55;
}

.post-action:disabled:hover {
  color: inherit;
  background: transparent;
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

.comment-message {
  margin-bottom: var(--space-4);
}

.comment-skeleton,
.comment-empty {
  margin-top: var(--space-5);
}

.comment-empty {
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
  text-align: center;
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
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--space-3);
}

.comment-meta-actions,
.comment-management-actions,
.comment-edit-actions {
  display: flex;
  align-items: center;
}

.comment-meta-actions {
  justify-content: flex-end;
  gap: var(--space-2);
}

.comment-management-actions {
  gap: var(--space-1);
}

.comment-management-actions :deep(.p-button) {
  width: 30px;
  height: 30px;
  padding: 0;
}

.comment-management-actions :deep(svg) {
  width: 15px;
  height: 15px;
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

.comment-edit-form {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);

  margin-top: var(--space-3);
}

.comment-edit-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
}

.comment-edit-actions {
  gap: var(--space-2);
}

.comment-like-button {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);

  margin-top: var(--space-2);
  padding: var(--space-1) var(--space-2);

  color: var(--color-text-secondary);
  font-family: var(--font-family-base);
  font-size: var(--font-size-xs);

  cursor: pointer;

  background: transparent;
  border: 0;
  border-radius: var(--radius-sm);

  transition:
    color 0.2s ease,
    background-color 0.2s ease;
}

.comment-like-button:hover,
.comment-like-button--liked {
  color: var(--color-accent);
}

.comment-like-button:hover {
  background: var(--color-accent-pale);
}

.comment-like-button:disabled {
  cursor: wait;
  opacity: 0.55;
}

.comment-like-button:focus-visible {
  outline: 3px solid var(--color-accent-soft);
  outline-offset: 2px;
}

.comment-like-button svg {
  width: 15px;
  height: 15px;
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

  .comment-meta-actions {
    flex-wrap: wrap;
  }

  .comment-edit-footer {
    align-items: stretch;
    flex-direction: column;
  }

  .comment-edit-actions {
    justify-content: flex-end;
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
