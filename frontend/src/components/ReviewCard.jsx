// const Card = ({ , showActions = false, onEdit, onDelete }) => {
//   const renderStars = (rating) => {
//     return Array.from({ length: 5 }, (_, i) => (
//       <svg
//         key={i}
//         className={`w-4 h-4 ${i < rating ? 'text-yellow-400' : 'text-gray-500'}`}
//         fill="currentColor"
//         viewBox="0 0 20 20"
//       >
//         <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
//       </svg>
//     ));
//   };

//   return (
//     <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 flex gap-4">
//       {/* User Avatar */}
//       <img
//         src={.userImage || 'https://via.placeholder.com/40'}
//         alt={.userName}
//         className="w-10 h-10 rounded-full object-cover"
//       />

//       {/* Content */}
//       <div className="flex-1">
//         <div className="flex items-center justify-between">
//           <h4 className="text-white font-semibold">{.userName}</h4>
//           <div className="flex">{renderStars(.rating)}</div>
//         </div>
//         <p className="text-gray-400 text-sm mt-1">{.comment}</p>

//         <div className="flex items-center justify-between mt-2 text-gray-500 text-xs">
//           <span>{new Date(.createdAt).toLocaleDateString()}</span>
//           {showActions && (
//             <div className="flex items-center gap-2">
//               <button
//                 onClick={() => onEdit()}
//                 className="text-blue-400 hover:text-blue-500 transition text-xs"
//               >
//                 Edit
//               </button>
//               <button
//                 onClick={() => onDelete(.id)}
//                 className="text-red-500 hover:text-red-600 transition text-xs"
//               >
//                 Delete
//               </button>
//             </div>
//           )}
//         </div>
//       </div>
//     </div>
//   );
// };

// export default Card;
