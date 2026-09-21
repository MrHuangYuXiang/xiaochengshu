// 转换生日为年龄
export const formatBirthday = (birthday: string): string => {
  if (!birthday) {
    return "未知"
  }
  const birthDate = new Date(birthday)
  const currentDate = new Date()
  const age = currentDate.getFullYear() - birthDate.getFullYear()
  return age.toString() + "岁"
}

// 转换时间格式为距离当前时间
export const formatTime = (time: string): string => {
  if (!time) return '';

  const now = Date.now();
  const target = new Date(time).getTime();

  if (isNaN(target)) return '';

  // 时间差（毫秒）
  const diff = now - target;
  if (diff < 0) return '刚刚';

  // 单位换算（毫秒）
  const second = 1000;
  const minute = 60 * second;
  const hour = 60 * minute;
  const day = 24 * hour;
  const week = 7 * day;
  const month = 30 * day;
  const year = 365 * day;

  // 2. 按时间大小判断
  if (diff < minute) return '刚刚';
  if (diff < hour) return `${Math.floor(diff / minute)}分钟前`;
  if (diff < day) return `${Math.floor(diff / hour)}小时前`;
  if (diff < week) return `${Math.floor(diff / day)}天前`;
  if (diff < month) return `${Math.floor(diff / week)}周前`;
  if (diff < year) return `${Math.floor(diff / month)}月前`;

  return `${Math.floor(diff / year)}年前`;
};

// 转换关注状态为字符串
export const formatFollowStatus = (isFollow: number, isFollowed: number): string => {
  if (isFollow === 1 && isFollowed === 1) {
    return "互关"
  } else if (isFollow === 1 && isFollowed === 0) {
    return "已关注"
  } else if (isFollow === 0 && isFollowed === 1) {
    return "回关"
  } else {
    return "关注"
  }
}
