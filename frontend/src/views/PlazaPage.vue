<template>
  <section class="layout-container plaza-page">
    <ConfirmDialog />

    <ActivityFormDialog
      v-model:visible="isActivityFormDialogOpen"
      mode="create"
      @saved="handleActivityCreated"
    />

    <PostImageViewer
      v-model:visible="isPostImageViewerOpen"
      :images="viewerImages"
      :initial-index="viewerInitialIndex"
      :author-name="viewerAuthorName"
    />

    <input
      ref="editPostImageInput"
      type="file"
      multiple
      accept="image/jpeg,image/png,image/webp,image/gif"
      class="post-image-input"
      @change="handleEditPostImageChange"
    />

    <header class="plaza-heading">
      <p class="plaza-eyebrow">PHEIDI PLAZA</p>

      <h1 class="plaza-title">菲迪廣場</h1>

      <p class="plaza-description">
        分享每一次奔跑的故事，與跑友交流心得，一起發現更多值得參與的跑步活動。
      </p>
    </header>

    <Tabs id="plaza-tabs" v-model:value="activeTab" class="plaza-tabs">
      <div class="segmented-control plaza-segmented-control" role="group" aria-label="廣場內容">
        <span
          class="segmented-control__indicator"
          :class="{ 'segmented-control__indicator--second': activeTab === 'events' }"
          aria-hidden="true"
        ></span>

        <button
          id="plaza-tabs_tab_feed"
          class="segmented-control__option"
          type="button"
          :aria-pressed="activeTab === 'feed'"
          aria-controls="plaza-tabs_tabpanel_feed"
          @click="activeTab = 'feed'"
        >
          <span class="segmented-control__label">
            <UsersRound class="tab-icon" aria-hidden="true" />
            跑友動態
          </span>
        </button>

        <button
          id="plaza-tabs_tab_events"
          class="segmented-control__option"
          type="button"
          :aria-pressed="activeTab === 'events'"
          aria-controls="plaza-tabs_tabpanel_events"
          @click="activeTab = 'events'"
        >
          <span class="segmented-control__label">
            <CalendarDays class="tab-icon" aria-hidden="true" />
            活動情報
          </span>
        </button>
      </div>

      <TabPanels>
        <TabPanel value="feed">
          <div class="feed-content">
            <BaseCard as="form" class="post-composer" @submit.prevent="handleSubmitPost">
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

              <Message
                v-if="postSubmitErrorMessage"
                severity="error"
                :closable="false"
                aria-live="polite"
              >
                {{ postSubmitErrorMessage }}
              </Message>

              <input
                ref="postImageInput"
                type="file"
                multiple
                accept="image/jpeg,image/png,image/webp,image/gif"
                class="post-image-input"
                @change="handlePostImageChange"
              />

              <Message v-if="postImageErrorMessage" severity="error" :closable="false">
                {{ postImageErrorMessage }}
              </Message>

              <div v-if="selectedPostImages.length > 0" class="composer-image-preview">
                <div class="composer-preview-heading">
                  <span>照片預覽</span>
                  <span>{{ selectedPostImages.length }} / {{ maximumPostImageCount }} 張</span>
                </div>

                <div class="composer-preview-grid">
                  <figure
                    v-for="(image, index) in selectedPostImages"
                    :key="image.id"
                    class="composer-preview-item"
                  >
                    <img
                      :src="image.previewUrl"
                      :alt="`準備發布的第 ${index + 1} 張貼文照片預覽`"
                      class="composer-preview-image"
                    />

                    <Button
                      type="button"
                      severity="danger"
                      text
                      rounded
                      class="remove-photo-button"
                      :aria-label="`移除第 ${index + 1} 張照片`"
                      :disabled="isSubmittingPost"
                      @click="removePostImage(image.id)"
                    >
                      <template #icon>
                        <X aria-hidden="true" />
                      </template>
                    </Button>
                  </figure>
                </div>
              </div>

              <div class="composer-footer">
                <div class="composer-tools">
                  <Button
                    type="button"
                    :label="selectedPostImages.length > 0 ? '繼續加入照片' : '加入照片'"
                    severity="secondary"
                    text
                    class="photo-button"
                    :disabled="isSubmittingPost || !canAddPostImages"
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

                <BaseButton
                  type="submit"
                  label="發布貼文"
                  class="publish-post-button"
                  :loading="isSubmittingPost || isUploadingPostImage"
                  :disabled="!canSubmitPost || isSubmittingPost"
                >
                  <template #icon>
                    <Send aria-hidden="true" />
                  </template>
                </BaseButton>
              </div>
            </BaseCard>

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

                  <BaseButton
                    type="button"
                    label="重新載入"
                    variant="secondary"
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

              <BaseCard v-else-if="posts.length === 0" class="empty-state">
                <UsersRound class="empty-state-icon" aria-hidden="true" />

                <h3>目前還沒有跑友動態</h3>
                <p>成為第一位分享今天跑步故事的跑者吧！</p>
              </BaseCard>

              <div v-else class="post-list">
                <BaseCard v-for="post in posts" :key="post.id" as="article" class="post-card">
                  <header class="post-header">
                    <CircleUserRound class="post-avatar" aria-hidden="true" />

                    <div class="post-author-area">
                      <div class="post-author-row">
                        <h3 class="post-author">{{ post.author.username }}</h3>
                        <Tag
                          :value="post.runnerLevel"
                          severity="secondary"
                          class="runner-level-tag"
                        />
                      </div>

                      <time class="post-time" :datetime="post.createdAt">
                        {{ post.createdAtLabel }}
                        <span v-if="post.updatedAt !== post.createdAt">（已編輯）</span>
                      </time>
                    </div>

                    <div v-if="canManagePost(post)" class="post-management-actions">
                      <Button
                        type="button"
                        severity="secondary"
                        text
                        rounded
                        class="post-management-button management-button management-button--edit"
                        :aria-label="`編輯 ${post.author.username} 的貼文`"
                        :disabled="isUpdatingPost || deletingPostId !== null"
                        @click="startEditingPost(post)"
                      >
                        <template #icon>
                          <Pencil aria-hidden="true" />
                        </template>
                      </Button>

                      <Button
                        type="button"
                        severity="danger"
                        text
                        rounded
                        class="post-management-button management-button management-button--delete"
                        :aria-label="`刪除 ${post.author.username} 的貼文`"
                        :loading="deletingPostId === post.id"
                        :disabled="
                          isUpdatingPost || (deletingPostId !== null && deletingPostId !== post.id)
                        "
                        @click="confirmDeletePost(post)"
                      >
                        <template #icon>
                          <Trash2 aria-hidden="true" />
                        </template>
                      </Button>
                    </div>
                  </header>

                  <div v-if="editingPostId === post.id" class="post-edit-form">
                    <Textarea
                      v-model="editingPostContent"
                      rows="5"
                      maxlength="500"
                      auto-resize
                      aria-label="編輯貼文內容"
                      class="composer-textarea"
                    />

                    <Message v-if="postEditErrorMessage" severity="error" :closable="false">
                      {{ postEditErrorMessage }}
                    </Message>

                    <div
                      v-if="retainedPostImages.length > 0 || selectedEditPostImages.length > 0"
                      class="composer-image-preview"
                    >
                      <div class="composer-preview-heading">
                        <span>貼文照片</span>
                        <span>{{ editPostImageCount }} / {{ maximumPostImageCount }} 張</span>
                      </div>

                      <div class="composer-preview-grid">
                        <figure
                          v-for="(image, index) in retainedPostImages"
                          :key="`${image.url}-${index}`"
                          class="composer-preview-item"
                        >
                          <img
                            :src="image.url"
                            :alt="`目前貼文的第 ${index + 1} 張照片`"
                            class="composer-preview-image"
                          />

                          <Button
                            type="button"
                            severity="danger"
                            text
                            rounded
                            class="remove-photo-button"
                            :aria-label="`移除目前貼文的第 ${index + 1} 張照片`"
                            :disabled="isUpdatingPost"
                            @click="removeRetainedPostImage(index)"
                          >
                            <template #icon>
                              <X aria-hidden="true" />
                            </template>
                          </Button>
                        </figure>

                        <figure
                          v-for="(image, index) in selectedEditPostImages"
                          :key="image.id"
                          class="composer-preview-item"
                        >
                          <img
                            :src="image.previewUrl"
                            :alt="`準備加入貼文的第 ${index + 1} 張照片`"
                            class="composer-preview-image"
                          />

                          <Button
                            type="button"
                            severity="danger"
                            text
                            rounded
                            class="remove-photo-button"
                            :aria-label="`移除準備加入的第 ${index + 1} 張照片`"
                            :disabled="isUpdatingPost"
                            @click="removeEditPostImage(image.id)"
                          >
                            <template #icon>
                              <X aria-hidden="true" />
                            </template>
                          </Button>
                        </figure>
                      </div>
                    </div>

                    <div class="post-edit-footer">
                      <div class="post-edit-tools">
                        <Button
                          type="button"
                          label="加入照片"
                          severity="secondary"
                          text
                          class="photo-button"
                          :disabled="isUpdatingPost || !canAddEditPostImages"
                          @click="openEditPostImagePicker"
                        >
                          <template #icon>
                            <ImagePlus aria-hidden="true" />
                          </template>
                        </Button>

                        <span
                          class="character-count"
                          :class="{ 'character-count--warning': remainingEditPostCharacters <= 50 }"
                        >
                          還可以輸入 {{ remainingEditPostCharacters }} 個字
                        </span>
                      </div>

                      <div class="post-edit-actions">
                        <BaseButton
                          type="button"
                          label="取消"
                          variant="outline"
                          size="small"
                          :disabled="isUpdatingPost"
                          @click="cancelEditingPost"
                        />

                        <BaseButton
                          type="button"
                          label="儲存"
                          size="small"
                          :loading="isUpdatingPost"
                          :disabled="!canSaveEditedPost"
                          @click="handleUpdatePost(post)"
                        />
                      </div>
                    </div>
                  </div>

                  <template v-else>
                    <p class="post-content">{{ post.content }}</p>

                    <PostImageGrid
                      v-if="post.images.length > 0"
                      :images="post.images"
                      :author-name="post.author.username"
                      @open="openPostImageViewer(post, $event)"
                    />
                  </template>

                  <footer class="post-stats" aria-label="貼文互動統計">
                    <button
                      type="button"
                      class="post-action post-action--like"
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
                      class="post-action post-action--comment"
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

                        <BaseButton
                          type="submit"
                          label="送出留言"
                          size="small"
                          class="submit-comment-button"
                          :loading="isCommentSubmitting(post.id)"
                          :disabled="!canSubmitComment || isCommentSubmitting(post.id)"
                        >
                          <template #icon>
                            <Send aria-hidden="true" />
                          </template>
                        </BaseButton>
                      </div>
                    </form>

                    <Skeleton
                      v-if="isCommentLoading(post.id)"
                      height="6rem"
                      border-radius="var(--radius-md)"
                      class="comment-skeleton"
                    />

                    <div v-else-if="post.comments.length > 0" class="comment-list">
                      <BaseCard
                        v-for="comment in post.comments"
                        :key="comment.id"
                        as="article"
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
                                class="comment-management-actions management-actions"
                              >
                                <Button
                                  v-if="canEditComment(comment)"
                                  type="button"
                                  severity="secondary"
                                  text
                                  rounded
                                  size="small"
                                  class="management-button management-button--edit"
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
                                  class="management-button management-button--delete"
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
                                <BaseButton
                                  type="button"
                                  label="取消"
                                  size="small"
                                  :disabled="updatingCommentId === comment.id"
                                  @click="cancelEditingComment"
                                />

                                <BaseButton
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
                      </BaseCard>
                    </div>

                    <p v-else class="comment-empty">目前還沒有留言，成為第一位留言的跑友吧！</p>
                  </div>
                </BaseCard>

                <div
                  ref="feedSentinel"
                  class="feed-sentinel"
                  :aria-busy="isLoadingMore"
                  aria-live="polite"
                >
                  <div v-if="isLoadingMore" class="feed-pagination-state">
                    <Skeleton
                      height="4rem"
                      border-radius="var(--radius-lg)"
                      aria-label="正在載入更多跑友動態"
                    />
                  </div>

                  <Message
                    v-else-if="loadingMoreErrorMessage"
                    severity="error"
                    :closable="false"
                    class="feed-load-more-error"
                  >
                    <div class="state-message">
                      <span>{{ loadingMoreErrorMessage }}</span>

                      <BaseButton
                        type="button"
                        label="再試一次"
                        variant="secondary"
                        size="small"
                        @click="loadMorePosts"
                      />
                    </div>
                  </Message>

                  <p v-else-if="!hasMorePosts" class="feed-end-message">已經到底了</p>
                </div>
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

              <div class="event-heading-actions">
                <span class="event-count">共 {{ events.length }} 場</span>
                <BaseButton
                  type="button"
                  label="發起活動"
                  icon-pos="right"
                  class="create-event-button"
                  @click="isActivityFormDialogOpen = true"
                >
                  <template #icon>
                    <Plus aria-hidden="true" />
                  </template>
                </BaseButton>
              </div>
            </div>

            <Message v-if="eventErrorMessage" severity="error" :closable="false">
              <div class="state-message">
                <span>{{ eventErrorMessage }}</span>

                <BaseButton
                  type="button"
                  label="重新載入"
                  variant="secondary"
                  size="small"
                  @click="loadEvents"
                />
              </div>
            </Message>

            <div
              v-else-if="isEventLoading"
              class="event-grid"
              aria-label="活動情報載入中"
              aria-live="polite"
              aria-busy="true"
            >
              <Skeleton
                v-for="index in 4"
                :key="index"
                height="22rem"
                border-radius="var(--radius-lg)"
              />
            </div>

            <BaseCard v-else-if="events.length === 0" class="empty-state">
              <CalendarDays class="empty-state-icon" aria-hidden="true" />

              <h3>目前沒有近期活動</h3>
              <p>新的跑步活動準備好後，會第一時間在這裡公布。</p>
            </BaseCard>

            <div v-else class="event-grid">
              <BaseCard v-for="event in events" :key="event.id" as="article" class="event-card">
                <div class="event-date" aria-hidden="true">
                  <span class="event-month">{{ event.month }}</span>
                  <strong class="event-day">{{ event.day }}</strong>
                </div>

                <div class="event-content">
                  <div class="event-title-row">
                    <h3 class="event-title">{{ event.title }}</h3>

                    <Tag
                      :value="event.statusLabel"
                      :severity="event.statusSeverity"
                      :class="{ 'event-status-tag--available': event.status === 'available' }"
                    />
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

                    <div class="event-detail">
                      <dt>
                        <UsersRound aria-hidden="true" />
                        參加
                      </dt>
                      <dd>
                        {{ formatEventParticipantCount(event.participantCount, event.capacity) }}
                      </dd>
                    </div>
                  </dl>

                  <BaseButton
                    type="button"
                    label="查看活動"
                    icon="pi pi-arrow-right"
                    icon-pos="right"
                    class="event-button card-cta"
                    :aria-label="`查看活動：${event.title}`"
                    @click="viewEvent(event.id)"
                  />
                </div>
              </BaseCard>
            </div>
          </section>
        </TabPanel>
      </TabPanels>
    </Tabs>
  </section>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { isAxiosError } from 'axios'
import {
  CalendarDays,
  CircleUserRound,
  Clock3,
  Heart,
  ImagePlus,
  MapPin,
  MessageCircle,
  Pencil,
  Plus,
  Route,
  Send,
  Trash2,
  UsersRound,
  X,
} from '@lucide/vue'

import Button from 'primevue/button'
import ConfirmDialog from 'primevue/confirmdialog'
import Message from 'primevue/message'
import Skeleton from 'primevue/skeleton'
import TabPanel from 'primevue/tabpanel'
import TabPanels from 'primevue/tabpanels'
import Tabs from 'primevue/tabs'
import Tag from 'primevue/tag'
import Textarea from 'primevue/textarea'
import { useConfirm } from 'primevue/useconfirm'

import BaseCard from '@/components/base/BaseCard.vue'
import BaseButton from '@/components/base/BaseButton.vue'
import ActivityFormDialog from '@/components/events/ActivityFormDialog.vue'
import PostImageGrid from '@/components/plaza/PostImageGrid.vue'
import PostImageViewer from '@/components/plaza/PostImageViewer.vue'
import { getEvents } from '@/services/events'
import {
  createPost,
  createPostComment,
  deletePost,
  deletePostComment,
  getPostComments,
  getPosts,
  togglePostCommentLike,
  togglePostLike,
  updatePost,
  updatePostComment,
} from '@/services/posts'
import { uploadPostImages } from '@/services/uploads'
import { useAuthStore } from '@/stores/auth'
import type {
  PlazaPost as ApiPlazaPost,
  PostComment as ApiPostComment,
  PostImage,
  UploadedPostImage,
} from '@/types/post'
import type { Pagination } from '@/types/api'
import type { RunningEvent, RunningEventListItem } from '@/types/event'
import { formatEventDay, formatEventMonth, formatEventTimeRange } from '@/utils/date'
import {
  formatEventParticipantCount,
  getEventStatusPresentation,
  type EventStatusSeverity,
} from '@/utils/event'

type PlazaTab = 'feed' | 'events'

interface PlazaCommentView extends ApiPostComment {
  createdAtLabel: string
}

interface PlazaPostView extends ApiPlazaPost {
  runnerLevel: string
  createdAtLabel: string
  comments: PlazaCommentView[]
}

interface SelectedPostImage {
  id: string
  file: File
  previewUrl: string
}

interface PlazaEvent extends RunningEventListItem {
  month: string
  day: string
  description: string
  time: string
  statusLabel: string
  statusSeverity: EventStatusSeverity
}

const authStore = useAuthStore()
const confirm = useConfirm()
const route = useRoute()
const router = useRouter()

const activeTab = ref<PlazaTab>(route.query.tab === 'events' ? 'events' : 'feed')
const maximumPostLength = 500
const maximumPostImageSize = 5 * 1024 * 1024
const maximumPostImageCount = 4
const allowedPostImageTypes = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
const postContent = ref('')
const postImageInput = ref<HTMLInputElement | null>(null)
const selectedPostImages = ref<SelectedPostImage[]>([])
const uploadedPostImages = ref<UploadedPostImage[]>([])
const postImageErrorMessage = ref('')
const postSubmitErrorMessage = ref('')
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
const isLoadingMore = ref(false)
const isSubmittingPost = ref(false)
const feedErrorMessage = ref('')
const loadingMoreErrorMessage = ref('')
const postActionErrorMessage = ref('')
const pendingPostLikeIds = ref(new Set<string>())
const isEventLoading = ref(false)
const eventErrorMessage = ref('')
const isActivityFormDialogOpen = ref(false)
const posts = ref<PlazaPostView[]>([])
const feedSentinel = ref<HTMLElement | null>(null)
const postsPerPage = 10
const postPagination = ref<Pagination>({
  page: 0,
  limit: postsPerPage,
  total: 0,
  totalPages: 0,
})
const isPostImageViewerOpen = ref(false)
const viewerImages = ref<PostImage[]>([])
const viewerInitialIndex = ref(0)
const viewerAuthorName = ref('跑者')
const viewerPostId = ref<string | null>(null)
const editPostImageInput = ref<HTMLInputElement | null>(null)
const editingPostId = ref<string | null>(null)
const editingPostContent = ref('')
const retainedPostImages = ref<PostImage[]>([])
const selectedEditPostImages = ref<SelectedPostImage[]>([])
const uploadedEditPostImages = ref<UploadedPostImage[]>([])
const postEditErrorMessage = ref('')
const isUpdatingPost = ref(false)
const deletingPostId = ref<string | null>(null)

const events = ref<PlazaEvent[]>([])

const totalPosts = computed(() => postPagination.value.total)
const hasMorePosts = computed(
  () =>
    postPagination.value.page < postPagination.value.totalPages &&
    posts.value.length < postPagination.value.total,
)

const remainingCharacters = computed(() => maximumPostLength - postContent.value.length)

const canSubmitPost = computed(() => postContent.value.trim().length > 0)
const canAddPostImages = computed(() => selectedPostImages.value.length < maximumPostImageCount)
const editPostImageCount = computed(
  () => retainedPostImages.value.length + selectedEditPostImages.value.length,
)
const canAddEditPostImages = computed(() => editPostImageCount.value < maximumPostImageCount)
const remainingEditPostCharacters = computed(
  () => maximumPostLength - editingPostContent.value.length,
)
const canSaveEditedPost = computed(
  () => editingPostContent.value.trim().length > 0 && !isUpdatingPost.value,
)

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
  if (isFeedLoading.value) return

  feedErrorMessage.value = ''
  loadingMoreErrorMessage.value = ''
  isFeedLoading.value = true

  try {
    const response = await getPosts({ page: 1, limit: postsPerPage })

    posts.value = response.posts.map(toPostView)
    postPagination.value = response.pagination
    loadedCommentPostIds.value.clear()
    activeCommentPostId.value = null
  } catch (error: unknown) {
    feedErrorMessage.value = getApiErrorMessage(error, '載入跑友動態失敗，請稍後再試。')
  } finally {
    isFeedLoading.value = false
  }
}

async function loadMorePosts() {
  if (isFeedLoading.value || isLoadingMore.value || !hasMorePosts.value) return

  isLoadingMore.value = true
  loadingMoreErrorMessage.value = ''

  try {
    const response = await getPosts({
      page: postPagination.value.page + 1,
      limit: postsPerPage,
    })
    const loadedPostIds = new Set(posts.value.map((post) => post.id))
    const newPosts = response.posts.filter((post) => !loadedPostIds.has(post.id)).map(toPostView)

    posts.value.push(...newPosts)
    postPagination.value = response.pagination
  } catch (error: unknown) {
    loadingMoreErrorMessage.value = getApiErrorMessage(error, '載入更多跑友動態失敗，請稍後再試。')
  } finally {
    isLoadingMore.value = false
  }
}

const feedObserver = new IntersectionObserver(
  (entries) => {
    if (entries.some((entry) => entry.isIntersecting)) void loadMorePosts()
  },
  {
    rootMargin: '0px 0px 320px',
  },
)

watch(feedSentinel, (sentinel, previousSentinel) => {
  if (previousSentinel) feedObserver.unobserve(previousSentinel)
  if (sentinel) feedObserver.observe(sentinel)
})

function toPlazaEvent(event: RunningEventListItem): PlazaEvent {
  const statusPresentation = getEventStatusPresentation(event.status)

  return {
    ...event,
    month: formatEventMonth(event.startAt),
    day: formatEventDay(event.startAt),
    description: event.summary,
    time: formatEventTimeRange(event.startAt, event.endAt),
    statusLabel: statusPresentation.label,
    statusSeverity: statusPresentation.severity,
  }
}

async function loadEvents() {
  eventErrorMessage.value = ''
  isEventLoading.value = true

  try {
    const response = await getEvents()
    events.value = response.events.map(toPlazaEvent)
  } catch (error: unknown) {
    eventErrorMessage.value = getApiErrorMessage(error, '載入活動情報失敗，請稍後再試。')
  } finally {
    isEventLoading.value = false
  }
}

function viewEvent(eventId: string) {
  void router.push({
    name: 'event-detail',
    params: { eventId },
  })
}

function handleActivityCreated(event: RunningEvent) {
  events.value = [...events.value, toPlazaEvent(event)].sort(
    (firstEvent, secondEvent) =>
      new Date(firstEvent.startAt).getTime() - new Date(secondEvent.startAt).getTime(),
  )
}

function openPostImagePicker() {
  postImageInput.value?.click()
}

function revokePostImagePreviewUrls(images = selectedPostImages.value) {
  images.forEach((image) => URL.revokeObjectURL(image.previewUrl))
}

function clearPostImages() {
  revokePostImagePreviewUrls()
  selectedPostImages.value = []
  uploadedPostImages.value = []
  postImageErrorMessage.value = ''

  if (postImageInput.value) postImageInput.value.value = ''
}

function removePostImage(imageId: string) {
  const image = selectedPostImages.value.find((currentImage) => currentImage.id === imageId)

  if (image) URL.revokeObjectURL(image.previewUrl)

  selectedPostImages.value = selectedPostImages.value.filter(
    (currentImage) => currentImage.id !== imageId,
  )
  uploadedPostImages.value = []
  postImageErrorMessage.value = ''
}

function getPostImageKey(file: File) {
  return `${file.name}-${file.size}-${file.lastModified}`
}

function handlePostImageChange(event: Event) {
  const input = event.target as HTMLInputElement
  const files = Array.from(input.files ?? [])

  input.value = ''
  postImageErrorMessage.value = ''

  if (files.length === 0) return

  const existingImageKeys = new Set(
    selectedPostImages.value.map((image) => getPostImageKey(image.file)),
  )
  const newImages: SelectedPostImage[] = []
  const skippedReasons = new Set<string>()

  for (const file of files) {
    if (selectedPostImages.value.length + newImages.length >= maximumPostImageCount) {
      skippedReasons.add(`每篇貼文最多可加入 ${maximumPostImageCount} 張照片`)
      break
    }

    if (!allowedPostImageTypes.has(file.type)) {
      skippedReasons.add('僅支援 JPG、PNG、WebP 或 GIF')
      continue
    }

    if (file.size > maximumPostImageSize) {
      skippedReasons.add('每張照片不能超過 5 MB')
      continue
    }

    const imageKey = getPostImageKey(file)

    if (existingImageKeys.has(imageKey)) {
      skippedReasons.add('已略過重複選取的照片')
      continue
    }

    existingImageKeys.add(imageKey)
    newImages.push({
      id: `${imageKey}-${crypto.randomUUID()}`,
      file,
      previewUrl: URL.createObjectURL(file),
    })
  }

  if (newImages.length > 0) {
    selectedPostImages.value = [...selectedPostImages.value, ...newImages]
    uploadedPostImages.value = []
  }

  if (skippedReasons.size > 0) {
    postImageErrorMessage.value = `部分照片未加入：${Array.from(skippedReasons).join('、')}`
  }
}

function openPostImageViewer(post: PlazaPostView, imageIndex: number) {
  viewerImages.value = post.images
  viewerInitialIndex.value = imageIndex
  viewerAuthorName.value = post.author.username
  viewerPostId.value = post.id
  isPostImageViewerOpen.value = true
}

async function handleSubmitPost() {
  const content = postContent.value.trim()

  if (!content || isSubmittingPost.value) return

  postSubmitErrorMessage.value = ''
  postImageErrorMessage.value = ''
  isSubmittingPost.value = true

  if (
    selectedPostImages.value.length > 0 &&
    uploadedPostImages.value.length !== selectedPostImages.value.length
  ) {
    isUploadingPostImage.value = true

    try {
      const uploadResponse = await uploadPostImages(
        selectedPostImages.value.map((image) => image.file),
      )

      uploadedPostImages.value = uploadResponse.images
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
      ...(uploadedPostImages.value.length > 0
        ? {
            images: uploadedPostImages.value.map(({ url, publicId, width, height }) => ({
              url,
              publicId,
              width,
              height,
            })),
          }
        : {}),
    })

    const createdPost = toPostView(response.post)

    posts.value = [createdPost, ...posts.value.filter((post) => post.id !== createdPost.id)]
    postPagination.value.total += 1
    postPagination.value.totalPages = Math.ceil(
      postPagination.value.total / postPagination.value.limit,
    )
    postContent.value = ''
    clearPostImages()
  } catch (error: unknown) {
    postSubmitErrorMessage.value = getApiErrorMessage(error, '發布貼文失敗，請稍後再試。')
  } finally {
    isSubmittingPost.value = false
  }
}

function canManagePost(post: PlazaPostView) {
  return post.author._id === authStore.user?.id
}

function clearEditPostImages() {
  revokePostImagePreviewUrls(selectedEditPostImages.value)
  selectedEditPostImages.value = []
  uploadedEditPostImages.value = []

  if (editPostImageInput.value) editPostImageInput.value.value = ''
}

function startEditingPost(post: PlazaPostView) {
  if (!canManagePost(post) || isUpdatingPost.value || deletingPostId.value) return

  clearEditPostImages()
  editingPostId.value = post.id
  editingPostContent.value = post.content
  retainedPostImages.value = [...post.images]
  postEditErrorMessage.value = ''
  postActionErrorMessage.value = ''
}

function cancelEditingPost() {
  if (isUpdatingPost.value) return

  clearEditPostImages()
  editingPostId.value = null
  editingPostContent.value = ''
  retainedPostImages.value = []
  postEditErrorMessage.value = ''
}

function openEditPostImagePicker() {
  editPostImageInput.value?.click()
}

function removeRetainedPostImage(imageIndex: number) {
  retainedPostImages.value.splice(imageIndex, 1)
  postEditErrorMessage.value = ''
}

function removeEditPostImage(imageId: string) {
  const image = selectedEditPostImages.value.find((currentImage) => currentImage.id === imageId)

  if (image) URL.revokeObjectURL(image.previewUrl)

  selectedEditPostImages.value = selectedEditPostImages.value.filter(
    (currentImage) => currentImage.id !== imageId,
  )
  uploadedEditPostImages.value = []
  postEditErrorMessage.value = ''
}

function handleEditPostImageChange(event: Event) {
  const input = event.target as HTMLInputElement
  const files = Array.from(input.files ?? [])

  input.value = ''
  postEditErrorMessage.value = ''

  if (files.length === 0) return

  const existingImageKeys = new Set(
    selectedEditPostImages.value.map((image) => getPostImageKey(image.file)),
  )
  const newImages: SelectedPostImage[] = []
  const skippedReasons = new Set<string>()

  for (const file of files) {
    if (editPostImageCount.value + newImages.length >= maximumPostImageCount) {
      skippedReasons.add(`每篇貼文最多可加入 ${maximumPostImageCount} 張照片`)
      break
    }

    if (!allowedPostImageTypes.has(file.type)) {
      skippedReasons.add('僅支援 JPG、PNG、WebP 或 GIF')
      continue
    }

    if (file.size > maximumPostImageSize) {
      skippedReasons.add('每張照片不能超過 5 MB')
      continue
    }

    const imageKey = getPostImageKey(file)

    if (existingImageKeys.has(imageKey)) {
      skippedReasons.add('已略過重複選取的照片')
      continue
    }

    existingImageKeys.add(imageKey)
    newImages.push({
      id: `${imageKey}-${crypto.randomUUID()}`,
      file,
      previewUrl: URL.createObjectURL(file),
    })
  }

  if (newImages.length > 0) {
    selectedEditPostImages.value = [...selectedEditPostImages.value, ...newImages]
    uploadedEditPostImages.value = []
  }

  if (skippedReasons.size > 0) {
    postEditErrorMessage.value = `部分照片未加入：${Array.from(skippedReasons).join('、')}`
  }
}

async function handleUpdatePost(post: PlazaPostView) {
  const content = editingPostContent.value.trim()

  if (!content || editingPostId.value !== post.id || isUpdatingPost.value) return

  postEditErrorMessage.value = ''
  isUpdatingPost.value = true

  if (
    selectedEditPostImages.value.length > 0 &&
    uploadedEditPostImages.value.length !== selectedEditPostImages.value.length
  ) {
    try {
      const uploadResponse = await uploadPostImages(
        selectedEditPostImages.value.map((image) => image.file),
      )

      uploadedEditPostImages.value = uploadResponse.images
    } catch (error: unknown) {
      postEditErrorMessage.value = getApiErrorMessage(error, '貼文圖片上傳失敗，請稍後再試。')
      isUpdatingPost.value = false
      return
    }
  }

  try {
    const response = await updatePost(post.id, {
      content,
      retainedImageUrls: retainedPostImages.value.map((image) => image.url),
      ...(uploadedEditPostImages.value.length > 0
        ? {
            newImages: uploadedEditPostImages.value.map(({ url, publicId, width, height }) => ({
              url,
              publicId,
              width,
              height,
            })),
          }
        : {}),
    })
    const currentComments = post.comments
    const postIndex = posts.value.findIndex((currentPost) => currentPost.id === post.id)

    if (postIndex !== -1) {
      posts.value[postIndex] = {
        ...toPostView(response.post),
        comments: currentComments,
      }
    }

    clearEditPostImages()
    editingPostId.value = null
    editingPostContent.value = ''
    retainedPostImages.value = []
  } catch (error: unknown) {
    postEditErrorMessage.value = getApiErrorMessage(error, '更新貼文失敗，請稍後再試。')
  } finally {
    isUpdatingPost.value = false
  }
}

async function handleDeletePost(post: PlazaPostView) {
  if (deletingPostId.value || !canManagePost(post)) return

  deletingPostId.value = post.id
  postActionErrorMessage.value = ''

  try {
    await deletePost(post.id)

    posts.value = posts.value.filter((currentPost) => currentPost.id !== post.id)
    postPagination.value.total = Math.max(postPagination.value.total - 1, 0)
    postPagination.value.totalPages = Math.ceil(
      postPagination.value.total / postPagination.value.limit,
    )
    postPagination.value.page = Math.max(postPagination.value.page - 1, 0)
    loadedCommentPostIds.value.delete(post.id)
    pendingPostLikeIds.value.delete(post.id)

    if (activeCommentPostId.value === post.id) activeCommentPostId.value = null
    if (editingPostId.value === post.id) cancelEditingPost()

    if (viewerPostId.value === post.id) {
      isPostImageViewerOpen.value = false
      viewerImages.value = []
      viewerPostId.value = null
    }
  } catch (error: unknown) {
    postActionErrorMessage.value = getApiErrorMessage(error, '刪除貼文失敗，請稍後再試。')
  } finally {
    deletingPostId.value = null
  }
}

function confirmDeletePost(post: PlazaPostView) {
  if (deletingPostId.value || !canManagePost(post)) return

  confirm.require({
    header: '確認刪除貼文',
    message: '確定要刪除這則貼文嗎？貼文、留言、按讚與圖片都會一併刪除，且無法復原。',
    icon: 'pi pi-exclamation-triangle',
    acceptLabel: '確認刪除',
    rejectLabel: '取消',
    acceptClass: 'p-button-danger',
    accept: () => {
      void handleDeletePost(post)
    },
  })
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
  void loadEvents()
})

onBeforeUnmount(() => {
  feedObserver.disconnect()
  revokePostImagePreviewUrls(selectedPostImages.value)
  revokePostImagePreviewUrls(selectedEditPostImages.value)
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

  color: var(--color-dark-light);
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

.plaza-segmented-control {
  width: min(100%, 22rem);
}

.plaza-segmented-control .segmented-control__option {
  display: flex;
  align-items: center;
  justify-content: center;
}

.plaza-tabs :deep(.p-tabpanels) {
  padding: var(--space-6) 0 0;

  background: transparent;
}

.tab-placeholder {
  margin: 0;

  color: var(--color-text-secondary);
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

  border-radius: var(--radius-lg);
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
  display: flex;
  width: min(100%, 40rem);
  flex-direction: column;
  gap: var(--space-3);
  padding: var(--space-3);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  background: var(--color-background);
}

.composer-preview-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
}

.composer-preview-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: var(--space-2);
}

.composer-preview-item {
  position: relative;
  aspect-ratio: 1;
  min-width: 0;
  margin: 0;
  overflow: hidden;
  border-radius: var(--radius-md);
  background: var(--color-surface);
}

.composer-preview-image {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.remove-photo-button {
  position: absolute;
  top: var(--space-2);
  inset-inline-end: var(--space-2);
  width: calc(var(--space-6) + var(--space-1));
  height: calc(var(--space-6) + var(--space-1));
  padding: 0;

  color: var(--color-accent);
  background: color-mix(in srgb, var(--color-surface) 88%, transparent);
  backdrop-filter: blur(8px);
}

.remove-photo-button :deep(svg) {
  width: 17px;
  height: 17px;
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

.composer-footer :deep(.publish-post-button.p-button),
.event-heading-actions :deep(.create-event-button.p-button) {
  border-radius: var(--radius-full);
}

.character-count {
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
}

.character-count--warning {
  color: var(--color-dark);
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

  color: var(--color-dark-light);
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

.feed-sentinel {
  min-height: var(--space-5);
}

.feed-pagination-state,
.feed-load-more-error,
.feed-end-message {
  margin: 0;
}

.feed-end-message {
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
  text-align: center;
}

.post-card {
  display: flex;
  flex-direction: column;
  gap: var(--space-5);

  padding: var(--space-6);

  border-radius: var(--radius-lg);
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
  flex: 1;
}

.post-management-actions,
.post-edit-footer,
.post-edit-tools,
.post-edit-actions {
  display: flex;
  align-items: center;
}

.post-management-actions {
  flex: 0 0 auto;
  gap: var(--space-1);
}

.post-management-actions :deep(.post-management-button.p-button) {
  width: calc(var(--space-7) - var(--space-1));
  height: calc(var(--space-7) - var(--space-1));
  padding: 0;
}

.post-management-actions :deep(svg) {
  width: 18px;
  height: 18px;
}

.post-author-row {
  flex-wrap: wrap;
  gap: var(--space-2);
}

.post-author-row :deep(.runner-level-tag.p-tag) {
  color: var(--color-surface);
  background: var(--color-secondary);
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

.post-edit-form {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.post-edit-footer {
  justify-content: space-between;
  gap: var(--space-4);
}

.post-edit-tools {
  min-width: 0;
  gap: var(--space-4);
}

.post-edit-actions {
  flex: 0 0 auto;
  gap: var(--space-2);
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

.post-action--like:hover {
  color: var(--color-accent);
}

.post-action--comment:hover {
  color: var(--color-primary);
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
  outline: 3px solid var(--color-dark-light);
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

.comment-form-footer :deep(.submit-comment-button.p-button) {
  border-radius: var(--radius-full);
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

  transition: color 0.2s ease;
}

.comment-like-button:hover:not(:disabled),
.comment-like-button--liked {
  color: var(--color-accent);
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

  color: var(--color-dark-light);
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

.event-heading-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  flex-wrap: wrap;
  gap: var(--space-3);
}

.create-event-button {
  flex-direction: row-reverse;
}

.create-event-button :deep(svg) {
  width: 18px;
  height: 18px;
}

.event-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--space-5);
}

.event-grid > * {
  min-width: 0;
}

.event-card {
  display: flex;
  width: 100%;
  height: 100%;
  min-width: 0;
  align-items: flex-start;
  gap: var(--space-5);

  padding: var(--space-6);

  border-radius: var(--radius-lg);

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
  color: var(--color-dark);
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
  align-self: stretch;
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
  overflow-wrap: anywhere;
}

.event-description {
  margin: 0;

  color: var(--color-text-secondary);
  line-height: var(--line-height-base);
  overflow-wrap: anywhere;
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

  color: var(--color-dark-light);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
}

.event-detail dd {
  min-width: 0;
  margin: 0;

  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
  overflow-wrap: anywhere;
}

.event-detail svg {
  width: 16px;
  height: 16px;

  flex-shrink: 0;
}

.event-button {
  align-self: flex-end;
  margin-top: auto;
}

.submit-comment-button :deep(svg),
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

  border-radius: var(--radius-lg);
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

  .post-edit-footer {
    align-items: stretch;
    flex-direction: column;
  }

  .post-edit-tools {
    justify-content: space-between;
  }

  .post-edit-actions {
    justify-content: flex-end;
  }

  .composer-tools {
    justify-content: space-between;
  }

  .composer-preview-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
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

  .event-heading-row {
    align-items: flex-start;
    flex-direction: column;
  }

  .event-heading-actions {
    width: 100%;
    justify-content: space-between;
  }

  .event-date {
    width: 64px;
    height: 72px;
  }

  .event-title-row {
    align-items: flex-start;
    flex-direction: column;
  }

  .state-message {
    align-items: stretch;
    flex-direction: column;
  }

  .empty-state {
    padding: var(--space-7) var(--space-5);
  }
}

@media (prefers-reduced-motion: reduce) {
  .event-card {
    transition: box-shadow 0.2s ease;
  }

  .event-card:hover {
    transform: none;
  }
}
</style>
